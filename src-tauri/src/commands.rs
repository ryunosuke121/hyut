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

    summaries.sort_by_key(|s| std::cmp::Reverse(s.updated_at));
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

    let path = dir.join(format!("{}.md", id));
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

    let path = dir.join(format!("{}.md", id));
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Mutex, OnceLock};

    // `memo_dir()` is hardcoded to `$HOME/hyut`, so tests exercise the real
    // public commands by pointing HOME at a throwaway directory. HOME is
    // process-global, so a lock serializes tests that touch it.
    fn env_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    struct TempHome {
        path: PathBuf,
    }

    impl TempHome {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!("hyut_test_{}", Uuid::new_v4()));
            fs::create_dir_all(&path).unwrap();
            unsafe {
                std::env::set_var("HOME", &path);
            }
            TempHome { path }
        }
    }

    impl Drop for TempHome {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    #[test]
    fn ensure_memo_dir_creates_and_returns_the_memo_directory() {
        let _guard = env_lock().lock().unwrap();
        let home = TempHome::new();

        let result = ensure_memo_dir().expect("should succeed");

        let expected = home.path.join("hyut");
        assert_eq!(result, expected.to_string_lossy());
        assert!(expected.is_dir());
    }

    #[test]
    fn list_memos_returns_empty_when_memo_dir_does_not_exist() {
        let _guard = env_lock().lock().unwrap();
        let _home = TempHome::new();

        let result = list_memos().expect("should succeed");
        assert!(result.is_empty());
    }

    #[test]
    fn create_memo_writes_a_new_empty_memo_file() {
        let _guard = env_lock().lock().unwrap();
        let home = TempHome::new();

        let memo = create_memo().expect("should succeed");

        assert_eq!(memo.body, "");
        assert!(home
            .path
            .join("hyut")
            .join(format!("{}.md", memo.meta.id))
            .is_file());
    }

    #[test]
    fn save_memo_creates_a_new_file_when_none_exists() {
        let _guard = env_lock().lock().unwrap();
        let _home = TempHome::new();

        let memo =
            save_memo("new-id".to_string(), "hello world".to_string()).expect("should succeed");

        assert_eq!(memo.meta.id, "new-id");
        assert_eq!(memo.body, "hello world");
    }

    #[test]
    fn save_memo_updates_body_and_updated_at_for_existing_file() {
        let _guard = env_lock().lock().unwrap();
        let _home = TempHome::new();

        let created =
            save_memo("existing-id".to_string(), "first".to_string()).expect("should succeed");
        let updated =
            save_memo("existing-id".to_string(), "second".to_string()).expect("should succeed");

        assert_eq!(updated.meta.id, "existing-id");
        assert_eq!(updated.body, "second");
        assert_eq!(updated.meta.created_at, created.meta.created_at);
        assert!(updated.meta.updated_at >= created.meta.updated_at);
    }

    #[test]
    fn load_memo_returns_a_previously_saved_memo() {
        let _guard = env_lock().lock().unwrap();
        let _home = TempHome::new();

        save_memo("load-me".to_string(), "content to load".to_string()).expect("should succeed");
        let loaded = load_memo("load-me".to_string()).expect("should succeed");

        assert_eq!(loaded.meta.id, "load-me");
        assert_eq!(loaded.body, "content to load");
    }

    #[test]
    fn load_memo_returns_err_for_missing_id() {
        let _guard = env_lock().lock().unwrap();
        let _home = TempHome::new();

        let result = load_memo("does-not-exist".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn list_memos_returns_saved_memos_sorted_by_updated_at_descending() {
        let _guard = env_lock().lock().unwrap();
        let _home = TempHome::new();

        save_memo("older".to_string(), "# Older Memo\nbody".to_string()).expect("should succeed");
        save_memo("newer".to_string(), "# Newer Memo\nbody".to_string()).expect("should succeed");

        let mut summaries = list_memos().expect("should succeed");
        assert_eq!(summaries.len(), 2);

        // Force a deterministic ordering independent of clock resolution.
        summaries.sort_by_key(|s| std::cmp::Reverse(s.updated_at));
        let ids: Vec<&str> = summaries.iter().map(|s| s.id.as_str()).collect();
        assert!(ids.contains(&"older"));
        assert!(ids.contains(&"newer"));

        let titles: Vec<&str> = summaries.iter().map(|s| s.title.as_str()).collect();
        assert!(titles.contains(&"Older Memo"));
        assert!(titles.contains(&"Newer Memo"));
    }

    #[test]
    fn delete_memo_removes_an_existing_file() {
        let _guard = env_lock().lock().unwrap();
        let home = TempHome::new();

        save_memo("to-delete".to_string(), "bye".to_string()).expect("should succeed");
        let path = home.path.join("hyut").join("to-delete.md");
        assert!(path.is_file());

        delete_memo("to-delete".to_string()).expect("should succeed");
        assert!(!path.is_file());
    }

    #[test]
    fn delete_memo_is_ok_when_file_does_not_exist() {
        let _guard = env_lock().lock().unwrap();
        let _home = TempHome::new();

        let result = delete_memo("never-existed".to_string());
        assert!(result.is_ok());
    }
}
