"use client";

import Image from 'next/image';
import Tiggets from '@/public/Tiggets.png';

export default function ForgotPasswordForm() {
  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-[#123528] to-[#173529] p-6 shadow-md md:p-10">
      <div className="mb-6 flex flex-col items-center gap-1">
        <Image src={Tiggets} alt="Tiggets logo" width={190} height={72} className="h-auto" priority />
      </div>

      <form className="space-y-4" />
    </div>
  );
}
