import { v4 as uuidv4 } from 'uuid';

// Types
export type RoomType = 'company' | 'school' | 'event';
export type ParticipantRole = 'student' | 'professor' | 'entrepreneur' | 'worker' | 'none';
export type AttendanceStatus = 'present' | 'absent' | 'checked';

export interface Manager {
  id: string;
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Room {
  id: string;
  managerId: string;
  name: string;
  type: RoomType;
  createdAt: string;
}

export interface Participant {
  id: string;
  roomId: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  institution?: string;
  role?: string;
  department?: string;
  jobPosition?: string;
  course?: string;
  studentId?: string;
  period?: string;
  professorCode?: string;
  courses?: string[];
  subjects?: string[];
  eventName?: string;
  qrSecret: string;
  uniqueCode: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  participantId: string;
  roomId: string;
  checkIn: string;
  checkOut?: string;
  status: AttendanceStatus;
}

// Simple in-memory store (replace with backend later)
const STORAGE_KEY = 'qrcheck_data';

interface StoreData {
  managers: Manager[];
  rooms: Room[];
  participants: Participant[];
  attendance: AttendanceRecord[];
  currentManagerId: string | null;
}

function getStore(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { managers: [], rooms: [], participants: [], attendance: [], currentManagerId: null };
}

function saveStore(data: StoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Auth
export function signUp(name: string, phone: string, email: string, password: string): Manager {
  const store = getStore();
  if (store.managers.find(m => m.email === email)) throw new Error('Email already registered');
  const manager: Manager = { id: uuidv4(), name, phone, email, passwordHash: btoa(password), createdAt: new Date().toISOString() };
  store.managers.push(manager);
  store.currentManagerId = manager.id;
  saveStore(store);
  return manager;
}

export function login(email: string, password: string): Manager {
  const store = getStore();
  const manager = store.managers.find(m => m.email === email && m.passwordHash === btoa(password));
  if (!manager) throw new Error('Invalid credentials');
  store.currentManagerId = manager.id;
  saveStore(store);
  return manager;
}

export function logout() {
  const store = getStore();
  store.currentManagerId = null;
  saveStore(store);
}

export function getCurrentManager(): Manager | null {
  const store = getStore();
  if (!store.currentManagerId) return null;
  return store.managers.find(m => m.id === store.currentManagerId) || null;
}

// Rooms
export function createRoom(name: string, type: RoomType): Room {
  const store = getStore();
  if (!store.currentManagerId) throw new Error('Not authenticated');
  const room: Room = { id: uuidv4(), managerId: store.currentManagerId, name, type, createdAt: new Date().toISOString() };
  store.rooms.push(room);
  saveStore(store);
  return room;
}

export function getRooms(): Room[] {
  const store = getStore();
  if (!store.currentManagerId) return [];
  return store.rooms.filter(r => r.managerId === store.currentManagerId);
}

export function getRoom(id: string): Room | undefined {
  return getStore().rooms.find(r => r.id === id);
}

export function deleteRoom(id: string) {
  const store = getStore();
  store.rooms = store.rooms.filter(r => r.id !== id);
  store.participants = store.participants.filter(p => p.roomId !== id);
  store.attendance = store.attendance.filter(a => a.roomId !== id);
  saveStore(store);
}

// Participants
export function addParticipant(data: Omit<Participant, 'id' | 'qrSecret' | 'uniqueCode' | 'createdAt'>): Participant {
  const store = getStore();
  const participant: Participant = {
    ...data,
    id: uuidv4(),
    qrSecret: uuidv4(),
    uniqueCode: Math.floor(100000 + Math.random() * 900000).toString(),
    createdAt: new Date().toISOString(),
  };
  store.participants.push(participant);
  saveStore(store);
  return participant;
}

export function getParticipants(roomId: string): Participant[] {
  return getStore().participants.filter(p => p.roomId === roomId);
}

export function updateParticipant(id: string, data: Partial<Omit<Participant, 'id' | 'qrSecret' | 'uniqueCode' | 'createdAt'>>): Participant {
  const store = getStore();
  const idx = store.participants.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Participant not found');
  store.participants[idx] = { ...store.participants[idx], ...data };
  saveStore(store);
  return store.participants[idx];
}

export function deleteParticipant(id: string) {
  const store = getStore();
  store.participants = store.participants.filter(p => p.id !== id);
  store.attendance = store.attendance.filter(a => a.participantId !== id);
  saveStore(store);
}

export function getParticipantByQr(qrSecret: string): Participant | undefined {
  return getStore().participants.find(p => p.qrSecret === qrSecret);
}

// Attendance
export function checkIn(participantId: string, roomId: string): AttendanceRecord {
  const store = getStore();
  const room = store.rooms.find(r => r.id === roomId);
  const today = new Date().toISOString().split('T')[0];
  const existing = store.attendance.find(a => a.participantId === participantId && a.roomId === roomId && a.checkIn.startsWith(today));
  if (existing) return existing;

  const record: AttendanceRecord = {
    id: uuidv4(),
    participantId,
    roomId,
    checkIn: new Date().toISOString(),
    status: room?.type === 'event' ? 'checked' : 'present',
  };
  store.attendance.push(record);
  saveStore(store);
  return record;
}

export function checkOut(recordId: string) {
  const store = getStore();
  const record = store.attendance.find(a => a.id === recordId);
  if (record) {
    record.checkOut = new Date().toISOString();
    saveStore(store);
  }
}

export function getAttendance(roomId: string): AttendanceRecord[] {
  return getStore().attendance.filter(a => a.roomId === roomId);
}

export function getAttendanceForParticipant(participantId: string): AttendanceRecord[] {
  return getStore().attendance.filter(a => a.participantId === participantId);
}
