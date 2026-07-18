import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const DEVICE_ID_KEY = "okumaAtolyesiDeviceId";
const SYNC_TOKEN_KEY = "okumaAtolyesiSyncToken";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    return (character === "x" ? value : (value & 3) | 8).toString(16);
  });
}

function getDeviceCredentials() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  let syncToken = localStorage.getItem(SYNC_TOKEN_KEY);
  if (!deviceId) {
    deviceId = randomId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  if (!syncToken) {
    syncToken = `${randomId()}${randomId()}`;
    localStorage.setItem(SYNC_TOKEN_KEY, syncToken);
  }
  return { deviceId, syncToken };
}

export async function syncStudentProgress(state) {
  if (!supabase || !state.studentProfile?.name?.trim()) return { configured: false };

  const { deviceId, syncToken } = getDeviceCredentials();
  const { data: correction, error: correctionError } = await supabase.rpc("get_student_correction", {
    p_device_id: deviceId,
    p_sync_token: syncToken,
    p_known_revision: Number(state.cloudRevision) || 0
  });

  if (correctionError) throw correctionError;
  if (correction) return { configured: true, correction };

  const history = state.readingHistory || [];
  const comprehension = state.comprehensionHistory || [];
  const { error } = await supabase.rpc("sync_student_progress_v2", {
    p_device_id: deviceId,
    p_sync_token: syncToken,
    p_teacher_revision: Number(state.cloudRevision) || 0,
    p_student_name: state.studentProfile.name.trim(),
    p_grade: Number(state.studentProfile.grade) || null,
    p_reading_history: history,
    p_comprehension_history: comprehension,
    p_read_count: history.length,
    p_word_count: history.reduce((sum, item) => sum + (item.wordCount || 0), 0),
    p_reading_minutes: history.reduce((sum, item) => sum + (item.readingMinutes || 0), 0),
    p_last_text: history.at(-1)?.title || null,
    p_active_days: new Set(history.map((item) => item.date)).size
  });

  if (error) throw error;
  return { configured: true };
}

export async function loadTeacherReadingReport(pin) {
  if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
  const { data, error } = await supabase.rpc("teacher_reading_report", { access_pin: pin });
  if (error) throw error;
  return data || [];
}

export async function updateTeacherStudent(pin, student) {
  if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
  const { data, error } = await supabase.rpc("teacher_update_student", {
    access_pin: pin,
    target_student_id: student.id,
    new_name: student.name.trim(),
    new_grade: Number(student.grade),
    new_reading_history: student.readingHistory || []
  });
  if (error) throw error;
  return data;
}

export async function deleteTeacherStudent(pin, studentId) {
  if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
  const { data, error } = await supabase.rpc("teacher_delete_student", {
    access_pin: pin,
    target_student_id: studentId
  });
  if (error) throw error;
  return data;
}
