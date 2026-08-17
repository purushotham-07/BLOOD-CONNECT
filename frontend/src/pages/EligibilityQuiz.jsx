import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';

const QUESTIONS = [
  {
    id: 'ageWeight',
    title: '1. Age and Body Weight',
    desc: 'Are you between 18 and 65 years old, and do you weigh at least 45 kg (100 lbs)?',
    options: [
      { label: 'Yes, I meet both age and weight criteria', eligible: true },
      { label: 'No, I am under 18, over 65, or under 45 kg', eligible: false, reason: 'Donors must be 18–65 years old and at least 45 kg for medical safety.' },
    ],
  },
  {
    id: 'healthToday',
    title: '2. Today’s Health & Wellness',
    desc: 'Are you feeling fit and healthy today with no active cold, flu, fever, or infection in the last 48 hours?',
    options: [
      { label: 'Yes, I feel healthy and active today', eligible: true },
      { label: 'No, I have a cold, cough, fever, or throat infection', eligible: false, reason: 'Please wait until you are fully recovered (48 hours fever-free) before donating.' },
    ],
  },
  {
    id: 'donationInterval',
    title: '3. Previous Blood Donation Window',
    desc: 'Has it been at least 56 days (8 weeks) since your last whole blood donation?',
    options: [
      { label: 'Yes, it has been over 56 days (or I am a first-time donor)', eligible: true },
      { label: 'No, I donated blood within the last 56 days', eligible: false, reason: 'Your body needs 56 days to replenish red blood cells and iron stores.' },
    ],
  },
  {
    id: 'tattooPiercing',
    title: '4. Tattoos, Piercings & Dental Work',
    desc: 'Have you gotten any tattoo, major body piercing, or major dental surgery in the last 6 months?',
    options: [
      { label: 'No, none in the last 6 months', eligible: true },
      { label: 'Yes, I got a tattoo or piercing recently', eligible: false, reason: 'There is a standard 6-month safety deferral period after tattoos or piercings.' },
    ],
  },
  {
    id: 'medication',
    title: '5. Recent Antibiotics & Medication',
    desc: 'Have you taken oral antibiotics in the last 48 hours, or are you currently pregnant?',
    options: [
      { label: 'No, not on antibiotics and not pregnant', eligible: true },
      { label: 'Yes, currently taking antibiotics or pregnant', eligible: false, reason: 'Please wait 48 hours after completing antibiotics, and 6 months postpartum.' },
    ],
  },
];

export default function EligibilityQuiz() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
    setSubmitted(false);
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  const reasons = Object.values(answers)
    .filter((a) => !a.eligible && a.reason)
    .map((a) => a.reason);

  const isEligible = allAnswered && reasons.length === 0;

  return (
    <main className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl ring-1 ring-brand-200">
          🩺
        </span>
        <h1 className="mt-3 text-xl font-extrabold text-gray-900 sm:text-3xl">
          Donor Eligibility & Health Pre-Check
        </h1>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm max-w-lg mx-auto">
          Answer 5 quick medical guidelines to check if you are ready to donate blood today.
        </p>
      </div>

      {/* Quiz Questions */}
      <div className="mt-8 space-y-4">
        {QUESTIONS.map((q, idx) => {
          const selected = answers[q.id];
          return (
            <Card key={q.id}>
              <h2 className="text-sm font-bold text-gray-900 sm:text-base">{q.title}</h2>
              <p className="mt-0.5 text-xs text-gray-500">{q.desc}</p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, i) => {
                  const isSelected = selected?.label === opt.label;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(q.id, opt)}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-semibold transition ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/70 text-brand-900 ring-2 ring-brand-500/20'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && '✓'}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex flex-col items-center">
        {!submitted ? (
          <Button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className="w-full sm:w-auto px-8 py-3 text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs"
          >
            {allAnswered ? 'Check My Eligibility Result 🩸' : `Answer All Questions (${answeredCount}/5 Completed)`}
          </Button>
        ) : (
          <div className="w-full">
            {isEligible ? (
              <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/80 p-6 text-center animate-slide-up">
                <span className="text-4xl">🎉</span>
                <h3 className="mt-2 text-lg font-bold text-emerald-900">You Are Fully Eligible to Donate Blood!</h3>
                <p className="mt-1 text-xs text-emerald-700 max-w-md mx-auto">
                  You meet all standard medical safety guidelines. Ready to save a life today?
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Link to="/donor-profile">
                    <Button className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl">
                      Update Donor Profile 🩸
                    </Button>
                  </Link>
                  <Link to="/blood-requests">
                    <Button variant="secondary" className="text-xs font-bold py-2.5 px-4 rounded-xl">
                      Browse Urgent Requests
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 rounded-xl bg-white p-3 text-left text-xs text-gray-600 max-w-md mx-auto">
                  <strong className="text-gray-900 block mb-1">💡 Tips Before You Donate:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    <li>Drink 500ml of water 30 minutes before donating.</li>
                    <li>Eat a healthy, iron-rich meal (avoid greasy foods).</li>
                    <li>Bring a valid photo ID to the donation site.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-amber-500 bg-amber-50/80 p-6 text-center animate-slide-up">
                <span className="text-4xl">⏳</span>
                <h3 className="mt-2 text-lg font-bold text-amber-900">Temporary Deferral Notice</h3>
                <p className="mt-1 text-xs text-amber-800 max-w-md mx-auto">
                  Based on your responses, you are currently not advised to donate blood today:
                </p>

                <ul className="mt-3 space-y-1 text-xs text-left max-w-md mx-auto bg-white p-3 rounded-xl border border-amber-200">
                  {reasons.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-amber-900">
                      <span>•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    setAnswers({});
                    setSubmitted(false);
                  }}
                  className="mt-4 text-xs font-bold text-amber-900 hover:underline"
                >
                  🔄 Retake Quiz
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
