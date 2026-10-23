import { UserAccount } from "../types";

export type BaseEntry = {
  enteredBy?: string;
  enteredById?: number;
  enteredByUsername?: string;
  supervisorId?: number;
  supervisorName?: string;
  paidById?: number;
  paidByName?: string;
};

/**
 * Checks if the currentUser has permission to edit an entry.
 *
 * Rules:
 * 1. Admin can edit ANY entry created by any user.
 * 2. Non-admin users cannot edit Admin's entries or other users' entries.
 * 3. Non-admin users can ONLY edit entries entered by themselves.
 */
export function canEditEntry(
  entry: BaseEntry | null | undefined,
  currentUser: UserAccount | null | undefined,
  allUsers?: UserAccount[]
): boolean {
  if (!currentUser || !entry) return false;

  // 1. Admin has full edit access to all entries
  if (currentUser.role === "admin") {
    return true;
  }

  // 2. Direct ID match if enteredById is stored
  if (entry.enteredById != null && entry.enteredById !== 0) {
    return entry.enteredById === currentUser.id;
  }

  // 3. Direct Username match if enteredByUsername is stored
  if (entry.enteredByUsername) {
    return (
      entry.enteredByUsername.trim().toLowerCase() ===
      currentUser.username.trim().toLowerCase()
    );
  }

  // 4. Resolve via enteredBy string
  const enteredByStr = (entry.enteredBy || "").trim();
  if (!enteredByStr) {
    // If no enteredBy recorded and user is not admin, deny edit
    return false;
  }

  const enteredByLower = enteredByStr.toLowerCase();
  const currentNameLower = (currentUser.name || "").trim().toLowerCase();
  const currentUsernameLower = (currentUser.username || "").trim().toLowerCase();

  // Exact match with current user name or username
  if (
    enteredByLower === currentNameLower ||
    enteredByLower === currentUsernameLower
  ) {
    return true;
  }

  // Check against all users list to accurately map the creator to user ID
  if (allUsers && allUsers.length > 0) {
    const creatorUser = allUsers.find(u => {
      const uName = (u.name || "").trim().toLowerCase();
      const uUsername = (u.username || "").trim().toLowerCase();

      if (uName === enteredByLower || uUsername === enteredByLower) {
        return true;
      }
      // Substring match e.g. "Rajubhai" matches "Rajubhai (Site Supervisor)"
      if (
        (enteredByLower.length >= 3 && uName.includes(enteredByLower)) ||
        (uName.length >= 3 && enteredByLower.includes(uName)) ||
        (enteredByLower.length >= 3 && uUsername.includes(enteredByLower))
      ) {
        return true;
      }
      return false;
    });

    if (creatorUser) {
      // User found: only allow if this creator user matches the currently logged in user
      return creatorUser.id === currentUser.id;
    }
  }

  // Fallback heuristic: check if current user name matches enteredBy
  if (
    (enteredByLower.length >= 3 && currentNameLower.includes(enteredByLower)) ||
    (currentNameLower.length >= 3 && enteredByLower.includes(currentNameLower)) ||
    (enteredByLower.length >= 3 && currentUsernameLower.includes(enteredByLower))
  ) {
    // Prevent accidental non-admin matching on admin names
    const isAdminTerm =
      enteredByLower.includes("admin") ||
      enteredByLower.includes("kanjibhai") ||
      enteredByLower.includes("head office");
    if (isAdminTerm) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Checks if the currentUser has permission to delete an entry.
 * KSG Hisab rule: Only Admin can delete entries.
 */
export function canDeleteEntry(
  _entry: BaseEntry | null | undefined,
  currentUser: UserAccount | null | undefined
): boolean {
  if (!currentUser) return false;
  return currentUser.role === "admin";
}
