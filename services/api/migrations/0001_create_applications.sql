CREATE TABLE applications (
  id UUID PRIMARY KEY,
  company TEXT NOT NULL CHECK (char_length(btrim(company)) BETWEEN 1 AND 120),
  role TEXT NOT NULL CHECK (char_length(btrim(role)) BETWEEN 1 AND 120),
  stage TEXT NOT NULL CHECK (stage IN (
    'Saved', 'Applied', 'Interviewing', 'Offer', 'Closed'
  )),
  next_step TEXT CHECK (char_length(next_step) <= 240),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX applications_created_at_idx
  ON applications (created_at DESC);
