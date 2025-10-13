import { redirect } from 'next/navigation';

export default function Home() {
  // Redirecionar direto para o dashboard principal
  redirect('/dashboard');
}
