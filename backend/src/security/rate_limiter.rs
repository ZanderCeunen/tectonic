use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Thread-safe IP-based sliding window rate limiter
#[derive(Clone)]
pub struct RateLimiter {
    requests: Arc<Mutex<HashMap<IpAddr, Vec<Instant>>>>,
    max_requests: usize,
    window: Duration,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window: Duration) -> Self {
        Self {
            requests: Arc::new(Mutex::new(HashMap::new())),
            max_requests,
            window,
        }
    }

    /// Checks if a request from the given IP is allowed within the configured time window.
    /// Also protects against memory exhaustion by pruning stale records and capping the map.
    pub fn check(&self, ip: IpAddr) -> bool {
        let now = Instant::now();
        let mut map = self.requests.lock().unwrap();

        // Memory protection: if tracking more than 5,000 active IPs, prune stale ones
        if map.len() > 5_000 {
            map.retain(|_, timestamps| {
                timestamps.retain(|t| now.duration_since(*t) < self.window);
                !timestamps.is_empty()
            });
            // If still exceeding 10,000 entries (DoS flood), clear to prevent OOM
            if map.len() > 10_000 {
                map.clear();
            }
        }

        let timestamps = map.entry(ip).or_default();
        timestamps.retain(|t| now.duration_since(*t) < self.window);

        if timestamps.len() >= self.max_requests {
            return false;
        }

        timestamps.push(now);
        true
    }
}
