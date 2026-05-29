import { supabase } from "@/integrations/supabase/client";

// Alphanumeric chars without ambiguous 0/O, 1/I/L
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const makeInviteCode = (): string =>
  Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

/**
 * Generates 2 invite codes for a newly registered user.
 * Called right after a user successfully claims their invite code.
 */
export const generateUserInviteCodes = async (userId: string): Promise<void> => {
  await supabase.from("invite_codes").insert([
    { code: makeInviteCode(), owner_user_id: userId, is_active: true },
    { code: makeInviteCode(), owner_user_id: userId, is_active: true },
  ]);
};
