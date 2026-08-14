import { Storage } from './storage';

export interface BlockedUser {
  id: string;
  name: string;
  blockedAt: string;
}

const BLOCKED_USERS_KEY = 'safety_blocked_users_list';

/**
 * Gets the list of currently blocked users
 */
export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  try {
    const data = await Storage.getItem(BLOCKED_USERS_KEY);
    if (!data) return [];
    
    // Parse and handle both array format or malformed storage
    const list = JSON.parse(data);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('Error fetching blocked users list:', error);
    return [];
  }
};

/**
 * Blocks a user by adding them to the persistent blocked list
 */
export const blockUser = async (userId: string, name: string): Promise<void> => {
  try {
    const list = await getBlockedUsers();
    
    // Avoid duplicates
    if (!list.some(user => String(user.id) === String(userId))) {
      const updatedList: BlockedUser[] = [
        ...list,
        {
          id: String(userId),
          name: name || 'User',
          blockedAt: new Date().toISOString()
        }
      ];
      await Storage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updatedList));
      console.log(`Successfully blocked user: ${name} (${userId})`);
    }
  } catch (error) {
    console.error('Error blocking user:', error);
  }
};

/**
 * Unblocks a user by removing them from the persistent blocked list
 */
export const unblockUser = async (userId: string): Promise<void> => {
  try {
    const list = await getBlockedUsers();
    const updatedList = list.filter(user => String(user.id) !== String(userId));
    await Storage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updatedList));
    console.log(`Successfully unblocked user ID: ${userId}`);
  } catch (error) {
    console.error('Error unblocking user:', error);
  }
};

/**
 * Checks if a user is currently blocked
 */
export const isUserBlocked = async (userId: string): Promise<boolean> => {
  try {
    const list = await getBlockedUsers();
    return list.some(user => String(user.id) === String(userId));
  } catch (error) {
    console.error('Error checking user block status:', error);
    return false;
  }
};

// Zero-tolerance objectionable content word list for client-side validation
const OBJECTIONABLE_WORDS = [
  // Abusive & severe profanity
  'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'dick', 'pussy', 'whore', 'slut',
  // Hate speech & slurs
  'nigger', 'faggot', 'retard', 'kike', 'chink', 'dyke',
  // Explicit/sexual terms
  'porn', 'pornography', 'blowjob', 'handjob', 'orgasm', 'cum', 'naked photos', 'sex video',
  // Harassment & violent threats
  'kill yourself', 'kys', 'murder you', 'slit your throat', 'bomb'
];

/**
 * Checks if a string contains objectionable/abusive content.
 * Uses word boundaries to avoid false positives (e.g. matching "assist").
 */
export const containsObjectionableContent = (text: string): boolean => {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase().trim();
  
  return OBJECTIONABLE_WORDS.some(word => {
    // Escape characters for regex safety
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match the word with word boundaries to avoid false positives
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
    return regex.test(normalizedText);
  });
};

