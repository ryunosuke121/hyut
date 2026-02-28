use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoMeta {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Memo {
    pub meta: MemoMeta,
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoSummary {
    pub id: String,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

const FRONTMATTER_DELIMITER: &str = "---";

pub fn parse_memo_file(content: &str, id: &str) -> Option<Memo> {
    if !content.starts_with(FRONTMATTER_DELIMITER) {
        return None;
    }

    let rest = &content[FRONTMATTER_DELIMITER.len()..];
    let end_idx = rest.find(&format!("\n{}", FRONTMATTER_DELIMITER))?;
    let yaml_str = &rest[..end_idx];
    let body_start = end_idx + 1 + FRONTMATTER_DELIMITER.len();
    let body = rest[body_start..].trim_start_matches('\n').to_string();

    let meta: MemoMeta = serde_yaml::from_str(yaml_str).ok().unwrap_or(MemoMeta {
        id: id.to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    });

    Some(Memo { meta, body })
}

pub fn serialize_memo(memo: &Memo) -> String {
    let yaml = serde_yaml::to_string(&memo.meta).unwrap_or_default();
    format!("---\n{}---\n{}", yaml, memo.body)
}

pub fn extract_title(body: &str) -> String {
    for line in body.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("# ") {
            return trimmed[2..].trim().to_string();
        }
        if !trimmed.is_empty() {
            return trimmed.chars().take(50).collect();
        }
    }
    "Untitled".to_string()
}
