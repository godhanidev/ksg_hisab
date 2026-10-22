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

  if (!projectName || projectName === "ALL") {
    return users;
  }

  const team = users.filter(u => {
    if (!u) return false;
    // 1. Explicitly assigned to this project
    if (u.assignedProjects && Array.isArray(u.assignedProjects) && u.assignedProjects.includes(projectName)) {
      return true;
    }
    // 2. Admin / Owner has access to all sites
    if (u.role === "admin") {
      return true;
    }
    // 3. Match project supervisor name if set
    if (
      project?.supervisorName &&
      u.name &&
      u.name.toLowerCase().includes(project.supervisorName.toLowerCase().trim())
    ) {
      return true;
    }
    return false;
  });

  // Safe fallback: If no members are explicitly assigned to this site yet,
  // return all non-empty users so the UI never displays an empty select or crashes
  return team.length > 0 ? team : users;
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
      // Try matching by id or partial name
      for (const [k, v] of summaryMap.entries()) {
        if (id && v.userId === id) {
          return v;
        }
        if (key && (k.includes(key) || key.includes(k))) {
          return v;
        }
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
      const person = getOrCreate(recipientName, tx.recipientId, tx.recipientRole);
      person.totalReceived += amt;
      person.transactionCount += 1;
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
