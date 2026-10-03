const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/views/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /ShieldCheck\n} from 'lucide-react';/,
  "ShieldCheck,\n  Rocket,\n  Wand2,\n  Compass,\n  Layers,\n  Activity\n} from 'lucide-react';"
);

const featureCardCode = `
const FeatureCard = ({ 
  title, 
  description, 
  icon: Icon, 
  lightIconBg, 
  lightIconText,
  darkIconGradient, 
  glowColor, 
  hoverBorder,
  onClick 
}: any) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={"relative p-6 sm:p-8 bg-white dark:bg-white/5 dark:backdrop-blur-xl border border-transparent dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-xl rounded-[2rem] transition-all duration-500 cursor-pointer overflow-hidden group hover:-translate-y-2 hover:shadow-2xl " + hoverBorder}
    >
      {/* Mouse flow glow - visible only in dark mode on hover */}
      <div 
        className="hidden dark:block absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"
        style={{
          background: "radial-gradient(400px circle at " + mousePos.x + "px " + mousePos.y + "px, " + glowColor + ", transparent 40%)"
        }}
      />
      
      {/* Icon Container */}
      <div className={"relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg " + lightIconBg + " dark:bg-gradient-to-br " + darkIconGradient}>
        <Icon className={"w-8 h-8 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] " + lightIconText + " dark:text-white"} />
      </div>
      
      <h3 className="relative z-10 text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">
        {title}
      </h3>
      <p className="relative z-10 text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
        {description}
      </p>
    </div>
  );
};
`;

if (!content.includes('const FeatureCard =')) {
  content = content.replace(
    /interface DashboardProps/,
    featureCardCode + '\ninterface DashboardProps'
  );
}

const startMarker = '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fadeIn" style={{ animationDelay: \'0.1s\' }}>';
const endMarker = '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 animate-fadeIn" style={{ animationDelay: \'0.2s\' }}>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newCards = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <FeatureCard 
          title="Smart Planner" 
          description="Generate optimized AI study schedules effortlessly."
          icon={Rocket}
          lightIconBg="bg-blue-100"
          lightIconText="text-blue-600"
          darkIconGradient="dark:from-blue-600/40 dark:to-cyan-600/40 dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          glowColor="rgba(59, 130, 246, 0.15)"
          hoverBorder="dark:hover:border-blue-500/50"
          onClick={() => onViewChange('planner')}
        />
        <FeatureCard 
          title="Quick Notes" 
          description="Magically convert topics into structured notes."
          icon={Wand2}
          lightIconBg="bg-indigo-100"
          lightIconText="text-indigo-600"
          darkIconGradient="dark:from-indigo-600/40 dark:to-purple-600/40 dark:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          glowColor="rgba(99, 102, 241, 0.15)"
          hoverBorder="dark:hover:border-indigo-500/50"
          onClick={() => onViewChange('notes')}
        />
        <FeatureCard 
          title="Skill Up" 
          description="Navigate your career with step-by-step roadmaps."
          icon={Compass}
          lightIconBg="bg-emerald-100"
          lightIconText="text-emerald-600"
          darkIconGradient="dark:from-emerald-600/40 dark:to-teal-600/40 dark:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          glowColor="rgba(16, 185, 129, 0.15)"
          hoverBorder="dark:hover:border-emerald-500/50"
          onClick={() => onViewChange('roadmap')}
        />
        <FeatureCard 
          title="Revision Cards" 
          description="Master completed topics with dynamic flashcards."
          icon={Layers}
          lightIconBg="bg-orange-100"
          lightIconText="text-orange-600"
          darkIconGradient="dark:from-orange-600/40 dark:to-rose-600/40 dark:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          glowColor="rgba(249, 115, 22, 0.15)"
          hoverBorder="dark:hover:border-orange-500/50"
          onClick={() => onViewChange('flashcards')}
        />
        <FeatureCard 
          title="Report Card" 
          description="Analyze detailed academic performance & stats."
          icon={Activity}
          lightIconBg="bg-blue-100"
          lightIconText="text-blue-600"
          darkIconGradient="dark:from-blue-600/40 dark:to-indigo-600/40 dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          glowColor="rgba(59, 130, 246, 0.15)"
          hoverBorder="dark:hover:border-blue-500/50"
          onClick={() => onViewChange('reportcard')}
        />
      </div>

      `;
  
  content = content.substring(0, startIndex) + newCards + content.substring(endIndex);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Dashboard feature cards updated successfully!');
} else {
  console.error('Could not find markers to replace cards');
}
