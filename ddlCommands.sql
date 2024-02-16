CREATE TABLE checkinout (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL,
    checkin_time TIMESTAMPTZ,
    checkout_time TIMESTAMPTZ
);

CREATE TABLE instructor_daily_time (
    id SERIAL PRIMARY KEY,
    instructor_id INT NOT NULL,
    date DATE NOT NULL,
    duration_minutes INT NOT NULL
);

CREATE INDEX idx_instructor_id ON checkinout (instructor_id);

CREATE INDEX idx_instructor_id_2 ON instructor_daily_time (instructor_id);