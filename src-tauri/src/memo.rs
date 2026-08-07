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

// Tiptap's markdown serializer renders an empty paragraph as a literal
// "&nbsp;" (or a raw NBSP char) to preserve blank lines, so a blank
// first line isn't actually an empty string here.
fn is_blank_line(line: &str) -> bool {
    line.replace("&nbsp;", "")
        .replace('\u{00A0}', "")
        .trim()
        .is_empty()
}

pub fn extract_title(body: &str) -> String {
    for line in body.lines() {
        let trimmed = line.trim();
        if let Some(stripped) = trimmed.strip_prefix("# ") {
            return stripped.trim().to_string();
        }
        if !is_blank_line(trimmed) {
            return trimmed.chars().take(50).collect();
        }
    }
    "Untitled".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_memo_file_parses_valid_frontmatter_and_body() {
        let content = "---\nid: abc-123\ncreated_at: 2024-01-01T00:00:00Z\nupdated_at: 2024-01-02T00:00:00Z\n---\n# Hello\nbody text";
        let memo = parse_memo_file(content, "abc-123").expect("should parse");

        assert_eq!(memo.meta.id, "abc-123");
        assert_eq!(
            memo.meta.created_at.to_rfc3339(),
            "2024-01-01T00:00:00+00:00"
        );
        assert_eq!(
            memo.meta.updated_at.to_rfc3339(),
            "2024-01-02T00:00:00+00:00"
        );
        assert_eq!(memo.body, "# Hello\nbody text");
    }

    #[test]
    fn parse_memo_file_strips_leading_blank_lines_from_body() {
        let content = "---\nid: abc\ncreated_at: 2024-01-01T00:00:00Z\nupdated_at: 2024-01-01T00:00:00Z\n---\n\n\nbody";
        let memo = parse_memo_file(content, "abc").expect("should parse");
        assert_eq!(memo.body, "body");
    }

    #[test]
    fn parse_memo_file_returns_none_without_leading_delimiter() {
        assert!(parse_memo_file("no frontmatter here", "abc").is_none());
    }

    #[test]
    fn parse_memo_file_returns_none_without_closing_delimiter() {
        let content = "---\nid: abc\ncreated_at: 2024-01-01T00:00:00Z\nupdated_at: 2024-01-01T00:00:00Z\nbody without closing delimiter";
        assert!(parse_memo_file(content, "abc").is_none());
    }

    #[test]
    fn parse_memo_file_falls_back_to_default_meta_on_invalid_yaml() {
        let content = "---\nnot: valid: yaml: at: all\n---\nbody";
        let memo = parse_memo_file(content, "fallback-id").expect("should still parse body");
        assert_eq!(memo.meta.id, "fallback-id");
        assert_eq!(memo.body, "body");
    }

    #[test]
    fn serialize_memo_round_trips_through_parse_memo_file() {
        let original = Memo {
            meta: MemoMeta {
                id: "round-trip".to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            body: "some **markdown** body".to_string(),
        };

        let serialized = serialize_memo(&original);
        let parsed = parse_memo_file(&serialized, &original.meta.id).expect("should parse");

        assert_eq!(parsed.meta.id, original.meta.id);
        assert_eq!(
            parsed.meta.created_at.to_rfc3339(),
            original.meta.created_at.to_rfc3339()
        );
        assert_eq!(
            parsed.meta.updated_at.to_rfc3339(),
            original.meta.updated_at.to_rfc3339()
        );
        assert_eq!(parsed.body, original.body);
    }

    #[test]
    fn serialize_memo_wraps_body_with_frontmatter_delimiters() {
        let memo = Memo {
            meta: MemoMeta {
                id: "id1".to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            body: "body content".to_string(),
        };

        let serialized = serialize_memo(&memo);
        assert!(serialized.starts_with("---\n"));
        assert!(serialized.ends_with("---\nbody content"));
    }

    #[test]
    fn extract_title_uses_first_h1_heading() {
        assert_eq!(extract_title("# My Title\nsome body"), "My Title");
    }

    #[test]
    fn extract_title_skips_leading_blank_lines() {
        assert_eq!(
            extract_title("\n\n# Title After Blank\nbody"),
            "Title After Blank"
        );
    }

    #[test]
    fn extract_title_treats_nbsp_placeholder_lines_as_blank() {
        assert_eq!(
            extract_title("&nbsp;\n\u{00A0}\nActual first line"),
            "Actual first line"
        );
    }

    #[test]
    fn extract_title_falls_back_to_truncated_first_line_without_heading() {
        assert_eq!(
            extract_title("just a plain paragraph"),
            "just a plain paragraph"
        );
    }

    #[test]
    fn extract_title_truncates_long_first_line_to_50_chars() {
        let long_line = "a".repeat(80);
        let title = extract_title(&long_line);
        assert_eq!(title.chars().count(), 50);
        assert_eq!(title, "a".repeat(50));
    }

    #[test]
    fn extract_title_returns_untitled_for_empty_body() {
        assert_eq!(extract_title(""), "Untitled");
        assert_eq!(extract_title("\n\n&nbsp;\n"), "Untitled");
    }
}
