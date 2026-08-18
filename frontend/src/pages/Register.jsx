import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import ErrorMessage from '../components/ErrorMessage';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'DONOR',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setError(null);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      if (form.role === 'DONOR') {
        navigate('/eligibility-quiz?onboarding=true', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-3 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
          <div className="text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl shadow-xs ring-1 ring-brand-100">
              🩸
            </span>
            <h1 className="mt-3 text-xl sm:text-2xl font-bold text-gray-900">Join BloodConnect</h1>
            <p className="mt-1 text-xs text-gray-500">
              Location-based blood coordination & real-time donor matching.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
            {error && <ErrorMessage error={error} />}

            <fieldset className="space-y-1.5">
              <legend className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                I want to join as:
              </legend>
              <div className="grid grid-cols-2 gap-2.5">
                <label
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center cursor-pointer transition ${
                    form.role === 'DONOR'
                      ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="DONOR"
                    checked={form.role === 'DONOR'}
                    onChange={onChange}
                    className="sr-only"
                  />
                  <span className="text-xl">🩸</span>
                  <span className="mt-1 text-xs font-bold">Blood Donor</span>
                  <span className="text-[10px] text-gray-500">I want to save lives</span>
                </label>

                <label
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center cursor-pointer transition ${
                    form.role === 'REQUESTER'
                      ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="REQUESTER"
                    checked={form.role === 'REQUESTER'}
                    onChange={onChange}
                    className="sr-only"
                  />
                  <span className="text-xl">🏥</span>
                  <span className="mt-1 text-xs font-bold">Blood Receiver</span>
                  <span className="text-[10px] text-gray-500">I need blood for patient</span>
                </label>
              </div>
            </fieldset>

            <Input
              label="Full Name"
              name="name"
              value={form.name}
              onChange={onChange}
              autoComplete="name"
              placeholder="e.g. Alex Rivera"
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              placeholder="name@example.com"
              required
            />

            <Input
              label="Phone Number (Optional)"
              name="phone"
              value={form.phone}
              onChange={onChange}
              autoComplete="tel"
              placeholder="+91 9876543210"
            />

            <Input
              label="Password (min 6 characters)"
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs"
            >
              {submitting ? 'Creating Account…' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}