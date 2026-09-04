import { supabase, supabaseAuthAux, isSupabaseConfigured } from "./supabaseClient";
import { mockAdapter } from "./mockAdapter";

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
  async update(id, patch) {
    if (!isSupabaseConfigured) return mockAdapter.updateTurnover(id, patch);
    const { data, error } = await supabase.from("turnover").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
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
  async listHold({ dateFrom, dateTo } = {}) {
    if (!isSupabaseConfigured) return mockAdapter.listHoldInterviews(range(dateFrom, dateTo));
    let q = supabase
      .from("interview_harian")
      .select("*, turnover:turnover(*)")
      .in("hasil_interview", ["Recommended", "Considered"])
      .order("tanggal_interview", { ascending: false });
    if (dateFrom) q = q.gte("tanggal_interview", dateFrom);
    if (dateTo) q = q.lte("tanggal_interview", dateTo);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  async listAvailablePool() {
    if (!isSupabaseConfigured) return mockAdapter.listAvailablePool();
    const { data, error } = await supabase
      .from("interview_harian")
      .select("*")
      .in("hasil_interview", ["Recommended", "Considered"])
      .is("turnover_id", null)
      .order("tanggal_interview", { ascending: false });
    if (error) throw error;
    return data;
  },
  async history(interviewId) {
    if (!isSupabaseConfigured) return mockAdapter.listInterviewHistory(interviewId);
    const { data, error } = await supabase
      .from("interview_turnover_log")
      .select("*, turnover:turnover(*)")
      .eq("interview_harian_id", interviewId)
      .order("assigned_at", { ascending: false });
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
  async remove(id) {
    if (!isSupabaseConfigured) return mockAdapter.deleteInterview(id);
    const { error } = await supabase.from("interview_harian").delete().eq("id", id);
    if (error) throw error;
  },
  async assignToTurnover(id, turnoverId) {
    return this.update(id, { turnover_id: turnoverId });
  },
  async turnoverHistory(turnoverId) {
    if (!isSupabaseConfigured) return mockAdapter.listTurnoverCandidateHistory(turnoverId);
    const { data, error } = await supabase
      .from("interview_turnover_log")
      .select("*, interview_harian:interview_harian(*)")
      .eq("turnover_id", turnoverId)
      .not("unassigned_at", "is", null)
      .order("assigned_at", { ascending: false });
    if (error) throw error;
    return data;
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

export const userApi = {
  async list() {
    if (!isSupabaseConfigured) return mockAdapter.listUsers();
    const { data, error } = await supabase.from("users").select("*").order("name");
    if (error) throw error;
    return data;
  },
  async create({ name, email, password, role, area_penempatan }) {
    if (!isSupabaseConfigured) return mockAdapter.createUser({ name, email, password, role, area_penempatan });
    const { data: signUpData, error: signUpError } = await supabaseAuthAux.auth.signUp({ email, password });
    if (signUpError) throw signUpError;
    if (!signUpData.user) throw new Error("Gagal membuat akun");
    const { data: profile, error: perr } = await supabase
      .from("users")
      .insert({ id: signUpData.user.id, name, email, role, area_penempatan: area_penempatan || null })
      .select()
      .single();
    if (perr) throw perr;
    return profile;
  },
  async update(id, patch) {
    if (!isSupabaseConfigured) return mockAdapter.updateUser(id, patch);
    const { data, error } = await supabase.from("users").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async remove(id) {
    if (!isSupabaseConfigured) return mockAdapter.removeUser(id);
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
  },
};

export const demo = {
  credentials: mockAdapter.DEMO_CREDENTIALS,
  reset: mockAdapter.resetDemoData,
};