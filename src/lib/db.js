import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { mockAdapter } from "./mockAdapter";

// -----------------------------------------------------------------------
// db.js is the ONLY place the rest of the app talks to for data.
// - If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set -> real Supabase.
// - Otherwise -> mockAdapter (localStorage demo data), so `npm run dev`
//   works immediately with no backend setup.
// See /supabase/schema.sql for the exact tables/columns this expects.
// -----------------------------------------------------------------------

export const usingDemoData = !isSupabaseConfigured;

function range(from, to) {
  return { dateFrom: from || null, dateTo: to || null };
}

export const auth = {
  async signIn(email, password) {
    if (!isSupabaseConfigured) return mockAdapter.signIn(email, password);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile, error: perr } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();
    if (perr) throw perr;
    return profile;
  },

  async signOut() {
    if (!isSupabaseConfigured) return mockAdapter.signOut();
    await supabase.auth.signOut();
  },

  async getSession() {
    if (!isSupabaseConfigured) return mockAdapter.getSession();
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.session.user.id)
      .single();
    return profile || null;
  },
};

export const ersApi = {
  async list({ dateFrom, dateTo } = {}) {
    if (!isSupabaseConfigured) return mockAdapter.listErs(range(dateFrom, dateTo));
    let q = supabase.from("ers_document").select("*").order("created_at", { ascending: false });
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  async create(payload) {
    if (!isSupabaseConfigured) return mockAdapter.createErs(payload);
    const { data, error } = await supabase.from("ers_document").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  // Accepting an ERS auto-creates its Turnover (server-side trigger for
  // Supabase, mirrored in mockAdapter for demo mode) -- nothing else to do
  // here, the caller doesn't need to know that happened.
  async updateStatus(id, status) {
    if (!isSupabaseConfigured) return mockAdapter.updateErsStatus(id, status);
    const { data, error } = await supabase.from("ers_document").update({ status }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
};

export const turnoverApi = {
  async list({ dateFrom, dateTo } = {}) {
    if (!isSupabaseConfigured) return mockAdapter.listTurnover(range(dateFrom, dateTo));
    let q = supabase.from("turnover").select("*").order("tanggal_permintaan", { ascending: false });
    if (dateFrom) q = q.gte("tanggal_permintaan", dateFrom);
    if (dateTo) q = q.lte("tanggal_permintaan", dateTo);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  async get(id) {
    if (!isSupabaseConfigured) return mockAdapter.getTurnover(id);
    const { data, error } = await supabase.from("turnover").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  // Generic update: used both for ER's simple status+note edit AND
  // Recruitment's richer edit (process dates + keterangan_proses + status).
  async update(id, patch) {
    if (!isSupabaseConfigured) return mockAdapter.updateTurnover(id, patch);
    const { data, error } = await supabase.from("turnover").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  // Kept as a thin alias over update() so ER's existing call site doesn't
  // need to change: updateStatus(id, status, extra) === update(id, {status, ...extra}).
  async updateStatus(id, status, extra = {}) {
    return this.update(id, { status, ...extra });
  },
};

export const interviewApi = {
  async list({ dateFrom, dateTo } = {}) {
    if (!isSupabaseConfigured) return mockAdapter.listInterviews(range(dateFrom, dateTo));
    let q = supabase.from("interview_harian").select("*, turnover:turnover(*)").order("tanggal_interview", { ascending: false });
    if (dateFrom) q = q.gte("tanggal_interview", dateFrom);
    if (dateTo) q = q.lte("tanggal_interview", dateTo);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  // "Data Peserta Wawancara": candidates on Hold, regardless of whether
  // they're currently assigned to a turnover or already Hired there.
  async listHold() {
    if (!isSupabaseConfigured) return mockAdapter.listHoldInterviews();
    const { data, error } = await supabase
      .from("interview_harian")
      .select("*, turnover:turnover(*)")
      .eq("kandidat_status", "Hold")
      .order("tanggal_interview", { ascending: false });
    if (error) throw error;
    return data;
  },
  // Candidates on Hold, not yet assigned to any turnover -- the pool
  // Recruitment picks from when "memilih peserta yang diajukan" for a
  // turnover.
  async listAvailablePool() {
    if (!isSupabaseConfigured) return mockAdapter.listAvailablePool();
    const { data, error } = await supabase
      .from("interview_harian")
      .select("*")
      .eq("kandidat_status", "Hold")
      .is("turnover_id", null)
      .order("tanggal_interview", { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(payload) {
    if (!isSupabaseConfigured) return mockAdapter.createInterview(payload);
    const { data, error } = await supabase.from("interview_harian").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async update(id, patch) {
    if (!isSupabaseConfigured) return mockAdapter.updateInterview(id, patch);
    const { data, error } = await supabase.from("interview_harian").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  // "Dibuang" -- there is no DB status for this, the row is removed outright.
  async remove(id) {
    if (!isSupabaseConfigured) return mockAdapter.deleteInterview(id);
    const { error } = await supabase.from("interview_harian").delete().eq("id", id);
    if (error) throw error;
  },
  // Assign (or unassign, pass null) this candidate to a turnover -- the
  // "diajukan" action on the Turnover edit screen.
  async assignToTurnover(id, turnoverId) {
    return this.update(id, { turnover_id: turnoverId });
  },
};

export const idCardApi = {
  async list({ dateFrom, dateTo } = {}) {
    if (!isSupabaseConfigured) return mockAdapter.listIdCards(range(dateFrom, dateTo));
    let q = supabase.from("id_card_process").select("*").order("tanggal_mulai", { ascending: false });
    if (dateFrom) q = q.gte("tanggal_mulai", dateFrom);
    if (dateTo) q = q.lte("tanggal_mulai", dateTo);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  async updateStatus(id, status) {
    if (!isSupabaseConfigured) return mockAdapter.updateIdCardStatus(id, status);
    const { data, error } = await supabase.from("id_card_process").update({ status }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async update(id, patch) {
    if (!isSupabaseConfigured) return mockAdapter.updateIdCard(id, patch);
    const { data, error } = await supabase.from("id_card_process").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async createFromInterview(interviewId) {
    if (!isSupabaseConfigured) return mockAdapter.createIdCardFromInterview(interviewId);
    const { data, error } = await supabase
      .from("id_card_process")
      .insert({ recruitment_id: interviewId, status: "Pending" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export const notificationsApi = {
  async list(limit = 20) {
    if (!isSupabaseConfigured) return mockAdapter.listNotifications(limit);
    const { data, error } = await supabase
      .from("my_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },
  async markRead(notificationId, userId) {
    if (!isSupabaseConfigured) return mockAdapter.markNotificationRead(notificationId);
    const { error } = await supabase
      .from("notification_reads")
      .upsert({ notification_id: notificationId, user_id: userId }, { onConflict: "notification_id,user_id" });
    if (error) throw error;
  },
  async markAllRead() {
    if (!isSupabaseConfigured) return mockAdapter.markAllNotificationsRead();
    const { error } = await supabase.rpc("mark_all_notifications_read");
    if (error) throw error;
  },
  // Live updates: fires `onInsert` the instant a new notification row is
  // created anywhere (any user, any role) — this is what makes the bell
  // badge update without a page refresh. No-op in demo mode (no realtime
  // backend to subscribe to).
  subscribe(onInsert) {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel("notifications-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        onInsert(payload.new);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};

export const demo = {
  credentials: mockAdapter.DEMO_CREDENTIALS,
  reset: mockAdapter.resetDemoData,
};
