use worker::*;

#[event(fetch)]
pub async fn fetch(_req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    Response::ok("Moonshot sync worker: ready for the Loro update protocol")
}

// TODO(moonshot-03): add a Durable Object per prep document. Validate update
// envelopes, persist snapshots to R2, and use D1 only for queryable metadata.
