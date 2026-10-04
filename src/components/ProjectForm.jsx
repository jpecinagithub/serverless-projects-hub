import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send, ShieldCheck, Info } from 'lucide-react';
import { api } from '../lib/api.js';
import { ImageUploader } from './ImageUploader.jsx';

const LIMITS = {
  title: 100,
  description: 500,
  authorName: 80,
  authorBio: 500,
};

function Field({ label, hint, error, children, optional }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-zinc-900">
        {label}{' '}
        {optional && <span className="font-normal text-zinc-500">(optional)</span>}
      </label>
      {children}
      <div className="mt-1.5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {hint && <p className="text-xs leading-relaxed text-zinc-500">{hint}</p>}
          {error && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Counter({ value, max }) {
  const remaining = max - (value?.length || 0);
  return (
    <span
      className={`shrink-0 text-xs tabular-nums ${remaining < 0 ? 'font-semibold text-red-600' : 'text-zinc-400'}`}
      aria-live="polite"
    >
      {remaining} left
    </span>
  );
}

const inputCls =
  'w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-[15px] text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-colors focus:border-zinc-950';

export function ProjectForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    title: '',
    url: '',
    description: '',
    author_name: '',
    author_bio: '',
    contact_email: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | uploading | publishing

  const busy = phase !== 'idle';

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  function validate() {
    const er = {};
    const v = {
      title: values.title.trim(),
      url: values.url.trim(),
      description: values.description.trim(),
      author_name: values.author_name.trim(),
      author_bio: values.author_bio.trim(),
      contact_email: values.contact_email.trim(),
    };
    if (!v.title) er.title = 'Project title is required.';
    else if (v.title.length > LIMITS.title) er.title = `Keep it under ${LIMITS.title} characters.`;

    if (!v.url) er.url = 'Project URL is required.';
    else if (!/^(https?:\/\/)?[^\s/$.?#].[^\s]*$/i.test(v.url))
      er.url = 'This URL is not valid.';

    if (!v.description) er.description = 'Description is required.';
    else if (v.description.length > LIMITS.description)
      er.description = `Keep it under ${LIMITS.description} characters.`;

    if (!v.author_name) er.author_name = 'Author name or nickname is required.';
    else if (v.author_name.length > LIMITS.authorName)
      er.author_name = `Keep it under ${LIMITS.authorName} characters.`;

    if (v.author_bio.length > LIMITS.authorBio)
      er.author_bio = `Keep it under ${LIMITS.authorBio} characters.`;

    if (v.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.contact_email))
      er.contact_email = 'This email address is not valid.';

    setErrors(er);
    return { er, v };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    const { er, v } = validate();
    if (Object.keys(er).length > 0) {
      document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      // 1–3. Optimize + upload the image first (server does the real work).
      let image_url = null;
      if (imageFile) {
        setPhase('uploading');
        const up = await api.uploadImage(imageFile);
        image_url = up.url;
      }

      // 4–5. Save the project with the resulting image URL.
      setPhase('publishing');
      const { project } = await api.createProject({
        title: v.title,
        url: v.url,
        description: v.description,
        author_name: v.author_name,
        author_bio: v.author_bio || null,
        contact_email: v.contact_email || null,
        image_url,
      });

      // 6–7. Take the user to the new project — it is already live.
      navigate(`/project/${project.id}?fresh=1`);
    } catch (err) {
      setPhase('idle');
      setSubmitError(
        err.message || "We couldn't publish your project. Please try again."
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {submitError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800"
        >
          {submitError}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-100/70 px-5 py-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-zinc-700" />
        <p className="text-sm leading-relaxed text-zinc-600">
          Providing an email address is optional. You may submit your project
          anonymously or using only a nickname — no account needed, ever.
        </p>
      </div>

      <Field label="Project title" error={errors.title}>
        <input
          className={inputCls}
          placeholder="e.g. InvoiceAI"
          maxLength={LIMITS.title + 10}
          value={values.title}
          onChange={set('title')}
          disabled={busy}
          aria-required="true"
        />
        <div className="mt-1 flex justify-end">
          <Counter value={values.title} max={LIMITS.title} />
        </div>
      </Field>

      <Field
        label="Project URL"
        hint="The public address of your project, e.g. https://myproject.vercel.app"
        error={errors.url}
      >
        <input
          className={inputCls}
          inputMode="url"
          placeholder="https://myproject.vercel.app"
          value={values.url}
          onChange={set('url')}
          disabled={busy}
          aria-required="true"
        />
      </Field>

      <Field label="Description" error={errors.description}>
        <textarea
          className={`${inputCls} min-h-28 resize-y`}
          placeholder="What does it do? What makes it interesting?"
          value={values.description}
          onChange={set('description')}
          disabled={busy}
          aria-required="true"
        />
        <div className="mt-1 flex justify-end">
          <Counter value={values.description} max={LIMITS.description} />
        </div>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Author / Nickname"
          hint="Your name, nickname, company or organization."
          error={errors.author_name}
        >
          <input
            className={inputCls}
            placeholder="e.g. Jon"
            maxLength={LIMITS.authorName + 10}
            value={values.author_name}
            onChange={set('author_name')}
            disabled={busy}
            aria-required="true"
          />
        </Field>

        <Field
          label="Contact email"
          hint="Optional — leave this blank if you prefer to remain anonymous. Never shown publicly."
          error={errors.contact_email}
          optional
        >
          <input
            className={inputCls}
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={values.contact_email}
            onChange={set('contact_email')}
            disabled={busy}
          />
        </Field>
      </div>

      <Field
        label="About you"
        hint="A short bio shown on your project page."
        error={errors.author_bio}
        optional
      >
        <textarea
          className={`${inputCls} min-h-20 resize-y`}
          placeholder="e.g. Finance professional experimenting with AI and serverless applications."
          value={values.author_bio}
          onChange={set('author_bio')}
          disabled={busy}
        />
        <div className="mt-1 flex justify-end">
          <Counter value={values.author_bio} max={LIMITS.authorBio} />
        </div>
      </Field>

      <ImageUploader onSelect={setImageFile} disabled={busy} />

      <div className="flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Your project is published immediately and becomes visible to everyone
          in the directory. Abusive content can be removed by moderators.
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-zinc-950/15 transition-all hover:-translate-y-px hover:bg-zinc-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-64"
      >
        {busy ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {phase === 'uploading' ? 'Optimizing image…' : 'Publishing…'}
          </>
        ) : (
          <>
            <Send size={18} />
            Publish Project
          </>
        )}
      </button>
    </form>
  );
}
