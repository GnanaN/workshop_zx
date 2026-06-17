import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Step1Role } from './onboarding/Step1Role';
import { Step2Product } from './onboarding/Step2Product';
import { Step3Competitors } from './onboarding/Step3Competitors';

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [product, setProduct] = useState({ name: '', url: '', description: '', audience: '', selling: '', advantages: '', strategy: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleComplete = async () => {
    if (!session) return;
    setSaving(true);

    const { error: roleErr } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', session.user.id);

    if (roleErr) {
      setSaving(false);
      return;
    }

    const { error: prodErr } = await supabase
      .from('products')
      .insert({
        user_id: session.user.id,
        name: product.name,
        url: product.url,
        description: product.description || null,
        target_audience: product.audience || null,
        selling_points: product.selling || null,
        advantages: product.advantages || null,
        strategy: product.strategy || null,
      });

    setSaving(false);

    if (prodErr) {
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  if (step === 1) {
    return <Step1Role onNext={(r) => { setRole(r); setStep(2); }} />;
  }
  if (step === 2) {
    return <Step2Product onNext={(p) => { setProduct(p); setStep(3); }} onBack={() => setStep(1)} />;
  }
  return <Step3Competitors productUrl={product.url} userId={session?.user?.id || ''} onComplete={handleComplete} onBack={() => setStep(2)} />;
}
