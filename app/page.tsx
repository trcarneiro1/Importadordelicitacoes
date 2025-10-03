import { redirect } from 'next/navigation';

export default function Home() {
  // Redirecionar diretamente para o dashboard
  redirect('/dashboard');
}
