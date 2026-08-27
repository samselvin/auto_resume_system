import React, { useEffect, useState } from 'react';
import { formatExactPostedAt, formatLinkedInJobSubtitle, getPostedAt } from '../lib/jobTime';
import { Job } from '../types';

export const PostedTime: React.FC<{ job: Job; compact?: boolean }> = ({ job, compact }) => {
  const postedAt = getPostedAt(job);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const subtitle = formatLinkedInJobSubtitle(job, now);
  const exact = postedAt > 0 ? formatExactPostedAt(postedAt) : job.location;

  if (compact) {
    return (
      <span className="text-[#666]" title={exact}>
        {subtitle}
      </span>
    );
  }

  return (
    <p className="text-xs text-[#666] dark:text-[#8e918f] leading-relaxed" title={exact}>
      {subtitle}
    </p>
  );
};
