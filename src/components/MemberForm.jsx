import { useState } from 'react';
import { UserPlus } from 'lucide-react';

const emptyMember = {
  name: '',
  phone: '',
  email: '',
  plan: 'Monthly',
};

export default function MemberForm({ members, onSubmit, submitting }) {
  const [form, setForm] = useState(emptyMember);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
    setForm(emptyMember);
  };

  return (
    <section className="rounded-2xl bg-white/90 p-4 shadow-lg">
      <h3 className="text-lg font-bold tracking-tight text-ink-800">Add Subscriber</h3>
      <p className="mt-1 text-base text-ink-600">Create members so checkout is faster.</p>

      <form onSubmit={handleSubmit} className="mt-3 grid gap-2 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-1 block text-base font-semibold text-ink-700">Name</span>
          <input
            required
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
            placeholder="Subscriber name"
          />
        </label>
        <label>
          <span className="mb-1 block text-base font-semibold text-ink-700">Phone</span>
          <input
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.phone}
            onChange={(event) => setField('phone', event.target.value)}
            placeholder="Optional"
          />
        </label>
        <label>
          <span className="mb-1 block text-base font-semibold text-ink-700">Plan</span>
          <select
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.plan}
            onChange={(event) => setField('plan', event.target.value)}
          >
            <option>Monthly</option>
            <option>Premium Monthly</option>
            <option>Quarterly</option>
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="mb-1 block text-base font-semibold text-ink-700">Email</span>
          <input
            type="email"
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            value={form.email}
            onChange={(event) => setField('email', event.target.value)}
            placeholder="Optional"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="md:col-span-2 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent-600 px-5 py-3 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
        >
          <UserPlus className="h-5 w-5" />
          {submitting ? 'Saving...' : 'Save Subscriber'}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {members.length === 0 && <p className="text-base text-ink-500">No subscribers yet.</p>}
        {members.map((member) => (
          <span key={member.id} className="rounded-full bg-brand-100 px-3 py-1 text-base font-medium text-brand-700">
            {member.name}
          </span>
        ))}
      </div>
    </section>
  );
}
