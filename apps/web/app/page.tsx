import { Button } from '../../../packages/shared-ui/src/components/button';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl p-12">
      <h1 className="text-3xl font-bold">LifeOS Core Bootstrap</h1>
      <p className="mt-4 text-slate-300">Production-ready implementation foundation is active.</p>
      <div className="mt-8">
        <Button>System Healthy</Button>
      </div>
    </main>
  );
}
