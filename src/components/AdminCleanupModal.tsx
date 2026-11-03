import React, { useState } from 'react';
import { ShieldAlert, Trash2, X, RefreshCcw } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

interface AdminCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCleanupModal({ isOpen, onClose }: AdminCleanupModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCleanup = async () => {
    if (confirmation !== 'DELETE') return;
    setIsProcessing(true);
    setFeedback('Starting cleanup...');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Collections to clean: institutions, users (maybe not users), system_settings (maybe not), print_orders, suggestions, madrasa_results, madrasa_tarbiyah
      // Timetables are excluded.
      // Institution specific data is in /institutions/{user.uid}/data/examMaster
      
      const collectionsToClean = [
        'madrasa_results',
        'madrasa_tarbiyah',
        'print_orders',
        'suggestions'
      ];

      const batch = writeBatch(db);

      for (const colName of collectionsToClean) {
        const querySnapshot = await getDocs(collection(db, colName));
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }
      
      // Clear examMaster data if exists
      const examMasterRef = doc(db, 'institutions', user.uid, 'data', 'examMaster');
      batch.delete(examMasterRef);

      await batch.commit();
      setFeedback('Cleanup completed successfully!');
      setTimeout(onClose, 2000);
    } catch (e: any) {
      setFeedback('Error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-4">
          <ShieldAlert className="text-red-500" /> Admin Data Cleanup
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          This will delete all data (except timetables). Type "DELETE" to confirm.
        </p>
        <input 
          type="text" 
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="Type DELETE"
          className="w-full p-3 border rounded-xl mb-4 font-mono font-bold"
        />
        <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button>
            <button 
                onClick={handleCleanup} 
                disabled={confirmation !== 'DELETE' || isProcessing}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
                {isProcessing ? <RefreshCcw className="animate-spin" /> : <Trash2 />}
                Confirm
            </button>
        </div>
        {feedback && <p className="mt-4 text-xs font-bold text-slate-700">{feedback}</p>}
      </div>
    </div>
  );
}
