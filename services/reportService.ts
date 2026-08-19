import { api } from "./api";
import { API_CONFIG } from "@/config/api";

export interface ReportPayload {
  reportedUserId: string;
  contentType: 'message' | 'profile';
  contentId?: string; // Optional message ID
  content?: string; // Optional reported text or comment
  reason?: string;
}

/**
 * Submits a safety report to the backend server.
 * Handles the unified reporting of user profiles and chat messages.
 */
export const reportContent = async (payload: ReportPayload): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("🛡️ [ReportService] Sending safety report to backend:", payload);
    const response = await api.post(API_CONFIG.ENDPOINTS.REPORTS, payload);
    
    if (response.error) {
      console.warn("⚠️ [ReportService] Backend report returned an error:", response.error);
      return { 
        success: false, 
        message: response.error.message || "Failed to submit report to server." 
      };
    }
    
    return { success: true, message: "Report submitted successfully." };
  } catch (error) {
    console.error("❌ [ReportService] Error submitting safety report:", error);
    return { success: false, message: "An unexpected error occurred while submitting the report." };
  }
};
