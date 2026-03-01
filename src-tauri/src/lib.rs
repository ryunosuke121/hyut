mod commands;
mod memo;

use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[cfg(target_os = "macos")]
mod macos {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{
        NSApplication, NSApplicationActivationPolicy, NSColor, NSWindow, NSWindowCollectionBehavior,
    };

    pub fn set_accessory_policy() {
        // setup内はメインスレッドで呼ばれる
        let mtm = unsafe { MainThreadMarker::new_unchecked() };
        let app = NSApplication::sharedApplication(mtm);
        app.setActivationPolicy(NSApplicationActivationPolicy::Accessory);
    }

    pub fn configure_window(ns_window: &NSWindow) {
        ns_window.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::FullScreenAuxiliary,
        );
        ns_window.setLevel(101); // NSPopUpMenuWindowLevel

        // Liquid Glass: transparent window background
        let clear = NSColor::clearColor();
        ns_window.setBackgroundColor(Some(&clear));
        ns_window.setAlphaValue(0.92);
    }

    pub fn show_window(ns_window: &NSWindow) {
        let mtm = unsafe { MainThreadMarker::new_unchecked() };
        let app = NSApplication::sharedApplication(mtm);
        #[allow(deprecated)]
        app.activateIgnoringOtherApps(true);
        ns_window.makeKeyAndOrderFront(None);
        ns_window.orderFrontRegardless();
    }

    pub fn hide_window(ns_window: &NSWindow) {
        ns_window.orderOut(None);
    }

    pub fn is_visible(ns_window: &NSWindow) -> bool {
        ns_window.isVisible()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::ensure_memo_dir,
            commands::list_memos,
            commands::load_memo,
            commands::save_memo,
            commands::create_memo,
            commands::delete_memo,
        ])
        .setup(|app| {
            let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyM);

            #[cfg(target_os = "macos")]
            {
                macos::set_accessory_policy();

                let window = app.get_webview_window("main").expect("main window");
                let ns_win = window.ns_window().expect("ns_window");
                let ns_window = unsafe { &*(ns_win as *const objc2_app_kit::NSWindow) };
                macos::configure_window(ns_window);

                let ns_ptr = ns_win as usize;
                app.global_shortcut()
                    .on_shortcut(shortcut, move |_app, _shortcut, event| {
                        if event.state != ShortcutState::Pressed {
                            return;
                        }
                        let ns_window = unsafe { &*(ns_ptr as *const objc2_app_kit::NSWindow) };
                        if macos::is_visible(ns_window) {
                            macos::hide_window(ns_window);
                        } else {
                            macos::show_window(ns_window);
                        }
                    })?;
            }

            #[cfg(not(target_os = "macos"))]
            {
                let handle = app.handle().clone();
                app.global_shortcut()
                    .on_shortcut(shortcut, move |_app, _shortcut, event| {
                        if event.state != ShortcutState::Pressed {
                            return;
                        }
                        if let Some(window) = handle.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })?;
            }

            if cfg!(debug_assertions) {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
