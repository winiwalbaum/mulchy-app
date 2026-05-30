import { supabase } from "@/integrations/supabase/client";

/**
 * Generates 2 invite codes for a newly registered user via SECURITY DEFINER RPC.
 * Uses a server-side function to bypass RLS (needed for email signup where
 * the user doesn't have an authenticated session yet).
 */
export const generateUserInviteCodes = async (userId: string): Promise<void> => {
  await supabase.rpc("generate_user_invite_codes", { p_user_id: userId });
};
