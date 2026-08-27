import React, { useState } from 'react';

interface CompanyLogoProps {
  name: string;
  initials: string;
  logoBg: string;
  logoUrl?: string;
}

function logoFromCompanyName(name: string): string | undefined {
  const key = name.toLowerCase();
  const domains: [string, string][] = [
    ['microsoft', 'microsoft.com'],
    ['google', 'google.com'],
    ['amazon', 'amazon.com'],
    ['adobe', 'adobe.com'],
    ['infosys', 'infosys.com'],
    ['swiggy', 'swiggy.com'],
    ['accenture', 'accenture.com'],
    ['caterpillar', 'caterpillar.com'],
    ['apple', 'apple.com'],
    ['meta', 'meta.com'],
    ['nvidia', 'nvidia.com'],
    ['ibm', 'ibm.com'],
    ['oracle', 'oracle.com'],
    ['salesforce', 'salesforce.com'],
    ['uber', 'uber.com'],
    ['philips', 'philips.com'],
  ];
  const hit = domains.find(([token]) => key.includes(token));
  return hit ? `https://logo.clearbit.com/${hit[1]}` : undefined;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ name, initials, logoBg, logoUrl }) => {
  const [failed, setFailed] = useState(false);
  const resolvedLogo = logoUrl || logoFromCompanyName(name);
  const showImg = Boolean(resolvedLogo) && !failed;

  return (
    <div
      className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-black/5 ${
        showImg ? 'bg-white' : `bg-gradient-to-br ${logoBg} text-white font-bold text-sm`
      }`}
    >
      {showImg ? (
        <img
          src={resolvedLogo}
          alt={`${name} logo`}
          className="w-full h-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
};
