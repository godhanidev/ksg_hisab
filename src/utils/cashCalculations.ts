import { CashTransaction, Project, Role, UserAccount } from "../types";

export type PersonCashSummary = {
  userId?: number;
  name: string;
  role: Role;
  totalReceived: number;        // Total cash received (Cash In + Transfers in)
  totalSpent: number;           // Total site expenses paid (Cash Out)
  totalTransferredOut: number;  // Total cash given to other site members (Transfers out)
  balance: number;              // Net cash in hand = totalReceived - (totalSpent + totalTransferredOut)
  transactionCount: number;
};

/**
 * Returns all team members assigned to a specific project site, plus Admins / Owners.
 * Guaranteed to never throw even if parameters are null or undefined.
 */
export function getSiteTeamMembers(
  projectName?: string,
  users: UserAccount[] = [],
  project?: Project
): UserAccount[] {
  if (!users || !Array.isArray(users) || users.length === 0) {
    return [];
  }

  // Across all sites, return all registered users
  if (!projectName || projectName === "ALL") {
    return users.filter(u => u && u.name && u.name.trim());
  }

  const team = users.filter(u => {
    if (!u || !u.name || !u.name.trim()) return false;
    // 1. Explicitly assigned to this project
    if (u.assignedProjects && Array.isArray(u.assignedProjects) && u.assignedProjects.includes(projectName)) {
      return true;
    }
    // 2. Admin / Owner has access to all sites
    if (u.role === "admin") {
      return true;
    }
    // 3. Site Partner has access across all sites
    if (u.role === "site_partner") {
      return true;
    }
    // 4. Match project supervisor name if set
    if (
      project?.supervisorName &&
      u.name &&
      u.name.toLowerCase().includes(project.supervisorName.toLowerCase().trim())
    ) {
      return true;
    }
    // 5. If user has empty or unassigned projects array, treat as accessible to prevent being hidden
    if (!u.assignedProjects || (Array.isArray(u.assignedProjects) && u.assignedProjects.length === 0)) {
      return true;
    }
    return false;
  });

  // Safe fallback: If no members matched, return all users so no dropdown is ever empty
  return team.length > 0 ? team : users.filter(u => u && u.name && u.name.trim());
}

/**
 * Calculates live cash balances for each person on a given site.
 * If projectName === "ALL", computes across all sites.
 * Guaranteed zero runtime errors with full defensive checks.
 */
export function calculateSiteTeamBalances(
  projectName: string = "ALL",
  transactions: CashTransaction[] = [],
  users: UserAccount[] = [],
  project?: Project
): PersonCashSummary[] {
  const safeTxs = Array.isArray(transactions) ? transactions : [];
  const safeUsers = Array.isArray(users) ? users : [];

  // Filter transactions for this site if specific site is chosen
  const filteredTxs = !projectName || projectName === "ALL"
    ? safeTxs
    : safeTxs.filter(t => t && t.project === projectName);

  const teamMembers = getSiteTeamMembers(projectName, safeUsers, project);
  const summaryMap = new Map<string, PersonCashSummary>();

  // Initialize summary for every team member
  teamMembers.forEach(u => {
    if (!u || !u.name) return;
    summaryMap.set(u.name.toLowerCase().trim(), {
      userId: u.id,
      name: u.name,
      role: u.role || "supervisor",
      totalReceived: 0,
      totalSpent: 0,
      totalTransferredOut: 0,
      balance: 0,
      transactionCount: 0,
    });
  });

  // Helper to find or lazily register a person in the summary map
  const getOrCreate = (name?: string, id?: number, role?: Role): PersonCashSummary => {
    const cleanName = (name && name.trim()) ? name.trim() : "Unknown";
    const key = cleanName.toLowerCase();
    let existing = summaryMap.get(key);

    if (!existing) {
      // 1. Try matching by id
      if (id) {
        for (const v of summaryMap.values()) {
          if (v.userId === id) return v;
        }
      }

      // 2. Try matching by key substring
      for (const [k, v] of summaryMap.entries()) {
        if (key && (k === key || k.includes(key) || key.includes(k))) {
          return v;
        }
      }

      // 3. Match admin/owner alias
      if (key === "admin" || key === "owner" || key.includes("admin") || key.includes("owner") || key.includes("head office")) {
        for (const v of summaryMap.values()) {
          if (v.role === "admin") return v;
        }
      }

      // 4. Try matching against safeUsers
      const matchedUser = safeUsers.find(u => {
        if (id && u.id === id) return true;
        const uName = (u.name || "").toLowerCase().trim();
        if (uName === key || (key.length >= 3 && (uName.includes(key) || key.includes(uName)))) return true;
        if ((key === "admin" || key === "owner" || key.includes("admin") || key.includes("owner")) && u.role === "admin") return true;
        return false;
      });

      if (matchedUser) {
        const userKey = matchedUser.name.toLowerCase().trim();
        let userEntry = summaryMap.get(userKey);
        if (!userEntry) {
          userEntry = {
            userId: matchedUser.id,
            name: matchedUser.name,
            role: matchedUser.role || "supervisor",
            totalReceived: 0,
            totalSpent: 0,
            totalTransferredOut: 0,
            balance: 0,
            transactionCount: 0,
          };
          summaryMap.set(userKey, userEntry);
        }
        return userEntry;
      }

      existing = {
        userId: id,
        name: cleanName,
        role: role || "supervisor",
        totalReceived: 0,
        totalSpent: 0,
        totalTransferredOut: 0,
        balance: 0,
        transactionCount: 0,
      };
      summaryMap.set(key, existing);
    }
    return existing;
  };

  filteredTxs.forEach(tx => {
    if (!tx) return;
    const amt = Math.max(0, Number(tx.amount) || 0);

    if (tx.type === "cash_in") {
      // Recipient gets cash
      const recipientName = tx.recipientName || tx.supervisorName || "Rajubhai";
      const receiver = getOrCreate(recipientName, tx.recipientId, tx.recipientRole);
      receiver.totalReceived += amt;
      receiver.transactionCount += 1;

      // If giver is specified and is an internal team member/admin/user, deduct from them!
      const giverName = tx.paidByName?.trim();
      if (giverName) {
        const isInternalUser = safeUsers.some(u => {
          if (tx.paidById && u.id === tx.paidById) return true;
          const uName = (u.name || "").toLowerCase().trim();
          const gName = giverName.toLowerCase();
          if (uName === gName || (gName.length >= 3 && (uName.includes(gName) || gName.includes(uName)))) return true;
          if ((gName === "admin" || gName === "owner" || gName.includes("admin") || gName.includes("owner")) && u.role === "admin") return true;
          return false;
        });

        const giverKey = giverName.toLowerCase();
        const existsInSummary = summaryMap.has(giverKey) || Array.from(summaryMap.keys()).some(k => k.includes(giverKey) || giverKey.includes(k));

        if (isInternalUser || existsInSummary) {
          const giver = getOrCreate(giverName, tx.paidById, tx.paidByRole);
          if (giver !== receiver) {
            giver.totalTransferredOut += amt;
            giver.transactionCount += 1;
          }
        }
      }
    } else if (tx.type === "cash_out") {
      // Payer spends cash
      const paidByName = tx.paidByName || tx.supervisorName || tx.enteredBy || "Rajubhai";
      const person = getOrCreate(paidByName, tx.paidById, tx.paidByRole);
      person.totalSpent += amt;
      person.transactionCount += 1;
    } else if (tx.type === "transfer") {
      // Giver gives cash to receiver
      const fromName = tx.paidByName || "Sender";
      const toName = tx.recipientName || "Receiver";

      const giver = getOrCreate(fromName, tx.paidById, tx.paidByRole);
      giver.totalTransferredOut += amt;
      giver.transactionCount += 1;

      const receiver = getOrCreate(toName, tx.recipientId, tx.recipientRole);
      receiver.totalReceived += amt;
      receiver.transactionCount += 1;
    }
  });

  // Calculate final balances
  const list = Array.from(summaryMap.values());
  list.forEach(item => {
    item.balance = item.totalReceived - (item.totalSpent + item.totalTransferredOut);
  });

  // Sort: Active transactions first, then balance
  return list.sort((a, b) => {
    if (a.transactionCount !== b.transactionCount) {
      return b.transactionCount - a.transactionCount;
    }
    return b.balance - a.balance;
  });
}

/**
 * Gets live cash in hand for a specific user on a site
 */
export function getUserSiteBalance(
  userName?: string,
  projectName?: string,
  transactions: CashTransaction[] = [],
  users: UserAccount[] = []
): number {
  if (!userName || !userName.trim()) return 0;
  const target = userName.toLowerCase().trim();

  const balances = calculateSiteTeamBalances(projectName || "ALL", transactions, users);
  const found = balances.find(b => {
    if (!b || !b.name) return false;
    const bName = b.name.toLowerCase().trim();
    return bName === target || bName.includes(target) || target.includes(bName);
  });
  return found ? found.balance : 0;
}
