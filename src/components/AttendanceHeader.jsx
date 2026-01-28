import React from 'react';

const AttendanceHeader = ({ subject, professor, date }) => {
  return (
    <div className="flex flex-col items-center text-center space-y-1 mb-6">
      <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
        {subject}
      </h1>
      <p className="text-sm md:text-base font-normal">
        {professor}
      </p>
      <p className="text-sm md:text-base font-normal">
        {date}
      </p>
      <div className="divider" />
    </div>
  );
};

export default AttendanceHeader;
