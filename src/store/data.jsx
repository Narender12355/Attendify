import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const DataCtx = createContext(null);
export const useData = () => useContext(DataCtx);

const pathRef = path => doc(db, ...path.split('/'));
const api = { set: (path, data) => setDoc(pathRef(path), data), del: path => deleteDoc(pathRef(path)) };
const KEYS = ['accounts', 'subjects', 'attendance', 'events', 'syllabus', 'progress', 'timetable'];
const rows = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
const byId = arr => Object.fromEntries((arr || []).map(x => [x.id, x]));

/**
 * Live Firestore data for the signed-in user.
 * Teachers see everything. Students only receive their own attendance and progress
 * (the Firestore rules enforce this on the server too).
 */
export function DataProvider({ me, children }) {
  const [st, setSt] = useState({});
  const [error, setError] = useState(null);
  const isTeacher = me.role === 'teacher';

  useEffect(() => {
    setSt({}); setError(null);
    const put = (key, value) => setSt(s => ({ ...s, [key]: value }));
    const onErr = e => setError(e);
    const offs = [];
    ['subjects', 'events', 'syllabus', 'timetable'].forEach(n =>
      offs.push(onSnapshot(collection(db, n), snap => put(n, rows(snap)), onErr)));
    if (isTeacher) {
      offs.push(onSnapshot(collection(db, 'users'), snap => put('accounts', rows(snap)), onErr));
      offs.push(onSnapshot(collection(db, 'attendance'), snap => put('attendance', rows(snap)), onErr));
      offs.push(onSnapshot(collection(db, 'progress'), snap => put('progress', rows(snap)), onErr));
    } else {
      put('accounts', [me]);
      offs.push(onSnapshot(query(collection(db, 'attendance'), where('studentId', '==', me.id)), snap => put('attendance', rows(snap)), onErr));
      offs.push(onSnapshot(doc(db, 'progress', me.id), snap => put('progress', snap.exists() ? [{ id: snap.id, ...snap.data() }] : []), onErr));
    }
    return () => offs.forEach(off => off());
  }, [me.id, isTeacher]);

  const loading = KEYS.some(k => st[k] === undefined);
  const value = useMemo(() => ({
    loading, error, api,
    accounts: st.accounts || [],
    subjects: (st.subjects || []).slice().sort((a, b) => a.code.localeCompare(b.code)),
    attendance: st.attendance || [],
    events: (st.events || []).slice().sort((a, b) => a.date.localeCompare(b.date)),
    syllabus: byId(st.syllabus), progress: byId(st.progress), timetable: byId(st.timetable)
  }), [st, loading, error]);

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
