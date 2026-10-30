/**
 * storageService — Persistent Local Storage for Tasks, Token, and Bookmarks
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStore = new Map();

export const StorageService = {
  async getItem(key) {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        return await AsyncStorage.getItem(key);
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStore.get(key) || null;
    } catch (e) {
      console.warn(`StorageService.getItem failed for ${key}:`, e);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
        return;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      memoryStore.set(key, value);
    } catch (e) {
      console.warn(`StorageService.setItem failed for ${key}:`, e);
    }
  },

  async removeItem(key) {
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
        return;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      memoryStore.delete(key);
    } catch (e) {
      console.warn(`StorageService.removeItem failed for ${key}:`, e);
    }
  },

  async getJSON(key, defaultValue = null) {
    const raw = await this.getItem(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  },

  async setJSON(key, value) {
    await this.setItem(key, JSON.stringify(value));
  },
};

export default StorageService;
