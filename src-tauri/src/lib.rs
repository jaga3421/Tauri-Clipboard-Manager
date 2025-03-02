// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use tauri_plugin_clipboard::Clipboard;
use serde::Serialize;
use active_win_pos_rs::get_active_window;

#[derive(Serialize)]
struct ClipboardData {
    text: String,
    source: String,
}

#[tauri::command]
async fn get_clipboard_text(app: tauri::AppHandle) -> Result<ClipboardData, String> {
    let clipboard = app.state::<Clipboard>();
    let text = clipboard.read_text().map_err(|e| e.to_string())?;
    
    let source = match get_active_window() {
        Ok(window) => window.app_name,
        Err(_) => "Unknown".to_string(),
    };

    Ok(ClipboardData { text, source })
}

#[tauri::command]
async fn set_clipboard_text(app: tauri::AppHandle, text: String) -> Result<(), String> {
    let clipboard = app.state::<Clipboard>();
    clipboard.write_text(text)
        .map_err(|e| e.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard::init())
        .invoke_handler(tauri::generate_handler![get_clipboard_text, set_clipboard_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
