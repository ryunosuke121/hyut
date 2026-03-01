use crate::memo::{self, Memo, MemoMeta, MemoSummary};
use chrono::Utc;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

fn memo_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join("hyut")
}

#[tauri::command]
pub fn ensure_memo_dir() -> Result<String, String> {
    let dir = memo_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn list_memos() -> Result<Vec<MemoSummary>, String> {
    let dir = memo_dir();
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut summaries: Vec<MemoSummary> = Vec::new();

    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "md") {
            let id = path
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            if let Some(m) = memo::parse_memo_file(&content, &id) {
                let title = memo::extract_title(&m.body);
                summaries.push(MemoSummary {
                    id: m.meta.id.clone(),
                    title,
                    created_at: m.meta.created_at,
                    updated_at: m.meta.updated_at,
                });
            }
        }
    }

    summaries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(summaries)
}

#[tauri::command]
pub fn load_memo(id: String) -> Result<Memo, String> {
    let path = memo_dir().join(format!("{}.md", id));
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    memo::parse_memo_file(&content, &id).ok_or_else(|| "Failed to parse memo".to_string())
}

#[tauri::command]
pub fn save_memo(id: String, body: String) -> Result<Memo, String> {
    let dir = memo_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let path = dir.join(format!("{}.md", &id));
    let now = Utc::now();

    let memo = if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        if let Some(mut existing) = memo::parse_memo_file(&content, &id) {
            existing.meta.updated_at = now;
            existing.body = body;
            existing
        } else {
            Memo {
                meta: MemoMeta {
                    id: id.clone(),
                    created_at: now,
                    updated_at: now,
                },
                body,
            }
        }
    } else {
        Memo {
            meta: MemoMeta {
                id: id.clone(),
                created_at: now,
                updated_at: now,
            },
            body,
        }
    };

    let serialized = memo::serialize_memo(&memo);
    fs::write(&path, serialized).map_err(|e| e.to_string())?;
    Ok(memo)
}

#[tauri::command]
pub fn create_memo() -> Result<Memo, String> {
    let dir = memo_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let memo = Memo {
        meta: MemoMeta {
            id: id.clone(),
            created_at: now,
            updated_at: now,
        },
        body: String::new(),
    };

    let path = dir.join(format!("{}.md", &id));
    let serialized = memo::serialize_memo(&memo);
    fs::write(&path, serialized).map_err(|e| e.to_string())?;
    Ok(memo)
}

#[tauri::command]
pub fn delete_memo(id: String) -> Result<(), String> {
    let path = memo_dir().join(format!("{}.md", id));
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
