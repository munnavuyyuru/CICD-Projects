import { Link } from 'react-router-dom';
import { HexGrid } from '../components/ui/HexGrid';
import { GlitchText } from '../components/ui/GlitchText';
import { NeonCard } from '../components/ui/NeonCard';

const features = [
  {
    title: 'NEURAL_PROJECTS.exe',
    desc: 'Organize work into discrete project nodes. Each project a self-contained execution unit.',
    icon: '⬡',
  },
  {
    title: 'TASK_STACK.dll',
    desc: 'Flow tasks through todo -> in_progress -> done. Kanban for the augmented mind.',
    icon: '◈',
  },
  {
    title: 'TEAM_SYNAPSE.sys',
    desc: 'Invite operatives. Assign roles. Role-based access gates for every operation.',
    icon: '⬢',
  },
  {
    title: 'SIGNAL_LOG.db',
    desc: 'Comments + activity feed on every task. Full audit trail. No data lost to the void.',
    icon: '◫',
  },
];

const principles = [
  '// PRINCIPLES',
  'No AI writes your tasks.',
  'No algorithm decides priority.',
  'No machine assigns your team.',
  'Human judgment. Human flow.',
];

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <HexGrid />

      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        <div className="animate-slide-up text-center max-w-4xl mx-auto mb-16">
          <p className="text-neon-magenta text-sm tracking-[0.3em] uppercase font-display mb-4">
            [ ANTI-AI PATTERN v2.4 // human-first task orchestration ]
          </p>

          <GlitchText as="h1" className="text-6xl md:text-8xl font-black tracking-tight mb-6">
            TASKFLOW
          </GlitchText>

          <p className="text-terminal-green text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            A task management system built by humans, for humans. No black-box AI prioritizing your
            work. No opaque algorithms deciding what matters. Just you, your team, and the flow.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-20 animate-slide-up">
          <Link
            to="/login"
            className="neon-border bg-abyss px-8 py-3 font-display text-sm tracking-widest uppercase text-neon-cyan transition-all duration-300 hover:bg-neon-cyan hover:text-void-black active:scale-95"
          >
            &gt; INIT_SESSION
          </Link>
          <Link
            to="/signup"
            className="neon-border-magenta bg-abyss px-8 py-3 font-display text-sm tracking-widest uppercase text-neon-magenta transition-all duration-300 hover:bg-neon-magenta hover:text-void-black active:scale-95"
          >
            &gt; NEW_OPERATOR
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mx-auto animate-slide-up">
          {features.map((f) => (
            <NeonCard key={f.title}>
              <span className="text-3xl mb-3 block text-neon-cyan">{f.icon}</span>
              <h3 className="font-display text-sm tracking-widest uppercase text-neon-magenta mb-2">
                {f.title}
              </h3>
              <p className="text-[0.8rem] leading-relaxed text-terminal-green/80">{f.desc}</p>
            </NeonCard>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 border-t border-grid-line">
        <div className="max-w-3xl mx-auto terminal-box animate-slide-up">
          {principles.map((line, i) => (
            <p
              key={i}
              className={i === 0 ? 'text-neon-magenta text-sm tracking-widest font-display mb-4' : 'text-terminal-green leading-relaxed'}
            >
              {line}
            </p>
          ))}
        </div>
      </section>

      <footer className="relative z-10 px-6 py-8 border-t border-grid-line text-center">
        <p className="text-[0.7rem] tracking-widest uppercase text-grid-line">
          TASKFLOW // VERSION 0.0.0-alpha // NODE {'>'} 127.0.0.1:5173 // STATUS: OPERATIONAL
        </p>
      </footer>
    </main>
  );
}