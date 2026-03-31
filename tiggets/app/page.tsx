// import Image from "next/image";
import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden font-text">
      <div className="absolute inset-0 bg-[url('/Login-bg.png')] bg-cover bg-center bg-fixed blur-lg" />
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}