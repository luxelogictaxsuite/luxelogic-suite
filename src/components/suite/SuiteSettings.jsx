import React from 'react';
import { useOutletContext } from 'react-router-dom';
import PreparerProfile from '@/components/suite/PreparerProfile';
import DeleteAccount from '@/components/suite/DeleteAccount';

export default function SuiteSettings() {
  const { me } = useOutletContext();
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-4xl">Settings</h2>
        <p className="mt-3 text-muted-foreground">Manage your preparer profile and account.</p>
      </div>
      {me?.role !== 'admin' && <PreparerProfile />}
      <DeleteAccount />
    </div>
  );
}