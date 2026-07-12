use std::sync::Arc;

use axum::{Json, Router, extract::State, http::StatusCode, routing::get};
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use tokio::sync::RwLock;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing::info;
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct Application {
    id: Uuid,
    company: String,
    role: String,
    stage: String,
    next_step: Option<String>,
}

#[derive(Deserialize)]
struct CreateApplication {
    company: String,
    role: String,
}

#[derive(Clone)]
struct AppState {
    applications: Arc<RwLock<Vec<Application>>>,
    pool: sqlx::postgres::PgPool,
}

#[derive(Debug, sqlx::FromRow)]
struct OutboxEvent {
    id: Uuid,
    topic: String,
    payload: serde_json::Value,
    created_at: OffsetDateTime,
    sent_at: Option<OffsetDateTime>,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    tracing_subscriber::fmt()
        .with_env_filter("moonshot_api=debug,tower_http=info")
        .init();

    let database_url = std::env::var("DATABASE_URL").expect("Must provide DATABASE_URL");

    let state = AppState {
        applications: Arc::new(RwLock::new(Vec::default())),
        pool: sqlx::postgres::PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await?,
    };

    sqlx::migrate!("./migrations").run(&state.pool).await?;

    // Optionally purge the db
    // sqlx::query("DELETE FROM applications")
    //     .execute(&state.pool)
    //     .await?;

    // sqlx::query("DELETE FROM outbox_events")
    //     .execute(&state.pool)
    //     .await?;

    let app = Router::new()
        .route("/health", get(|| async { StatusCode::NO_CONTENT }))
        .route(
            "/applications",
            get(list_applications).post(create_application),
        )
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:8787")
        .await
        .unwrap();
    info!("Moonshot API listening on http://127.0.0.1:8787");
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

async fn list_applications(
    State(state): State<AppState>,
) -> Result<Json<Vec<Application>>, (StatusCode, String)> {
    // Json(state.applications.read().await.clone())
    let applications = sqlx::query_as::<_, Application>(
        r#"
            SELECT id, company, role, stage, next_step
            FROM applications
            ORDER BY created_at DESC
            "#,
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|error| {
        tracing::error!(?error, "failed to list applications");
        (StatusCode::INTERNAL_SERVER_ERROR, "database error".into())
    })?;

    Ok(Json(applications))
}

async fn create_application(
    State(state): State<AppState>,
    Json(input): Json<CreateApplication>,
) -> Result<(StatusCode, Json<Application>), (StatusCode, &'static str)> {
    if input.company.trim().is_empty() || input.role.trim().is_empty() {
        return Err((
            StatusCode::UNPROCESSABLE_ENTITY,
            "company and role are required",
        ));
    }

    // We keep application creation and outbox in one transaction
    let mut tx = state.pool.begin().await.map_err(|err| {
        tracing::error!(?err, "failed to init db transaction");
        (StatusCode::INTERNAL_SERVER_ERROR, "database error")
    })?;

    let application: Application = sqlx::query_as(
        r#"
            INSERT INTO applications (id, company, role, stage)
            VALUES ($1, $2, $3, 'Saved')
            RETURNING id, company, role, stage, next_step
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(input.company.trim())
    .bind(input.role.trim())
    .fetch_one(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!(?err, "failed to create application");
        (StatusCode::INTERNAL_SERVER_ERROR, "database error")
    })?;

    let payload = serde_json::to_value(&application).map_err(|err| {
        tracing::error!(?err, "failed to serialize application");
        (StatusCode::INTERNAL_SERVER_ERROR, "database error")
    })?;

    sqlx::query(
        r#"
        INSERT INTO outbox_events (id, topic, payload)
        VALUES ($1, $2, $3)
        RETURNING id, topic, payload, created_at, sent_at
    "#,
    )
    .bind(Uuid::new_v4())
    .bind(String::from("application.create"))
    .bind(payload)
    .fetch_one(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!(?err, "failed to insert to outbox_events");
        (StatusCode::INTERNAL_SERVER_ERROR, "database error")
    })?;

    tx.commit().await.map_err(|err| {
        tracing::error!(?err, "failed to commit db transaction");
        (StatusCode::INTERNAL_SERVER_ERROR, "database error")
    })?;

    state.applications.write().await.push(application.clone());
    Ok((StatusCode::CREATED, Json(application)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn creating_an_application_creates_an_outbox_event(pool: PgPool) -> sqlx::Result<()> {
        let state = AppState {
            applications: Arc::new(RwLock::new(Vec::new())),
            pool,
        };

        let (_, Json(application)) = create_application(
            State(state.clone()),
            Json(CreateApplication {
                company: "Acme".into(),
                role: "Platform Engineer".into(),
            }),
        )
        .await
        .expect("valid application should be created");

        let new_app = sqlx::query_as::<_, Application>(
            r#"
                SELECT *
                FROM applications
            "#,
        )
        .fetch_one(&state.pool)
        .await?;

        assert_eq!(new_app.company, "Acme");
        assert_eq!(new_app.role, "Platform Engineer");
        assert_eq!(new_app.stage, "Saved");

        let event = sqlx::query_as::<_, OutboxEvent>(
            r#"
            SELECT id, topic, payload, created_at, sent_at
            FROM outbox_events
            WHERE payload->>'id' = $1
            "#,
        )
        .bind(String::from(application.id))
        .fetch_one(&state.pool)
        .await?;

        assert_eq!(event.topic, "application.create");
        assert_eq!(event.payload["company"], "Acme");
        assert!(event.sent_at.is_none());

        Ok(())
    }
}
