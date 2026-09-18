document.addEventListener('DOMContentLoaded', () => {
    const demoContainer = document.getElementById('demo-cards-container');
    if (!demoContainer) return;

    const demoPersonas = [
        { name: "Arjun", goal: "Muscle Gain", level: "Advanced", icon: "fa-dumbbell", color: "text-blue-400" },
        { name: "Priya", goal: "Weight Loss", level: "Intermediate", icon: "fa-fire", color: "text-orange-500" },
        { name: "Rahul", goal: "General Fitness", level: "Beginner", icon: "fa-running", color: "text-emerald-400" },
        { name: "Sneha", goal: "Mobility", level: "Beginner", icon: "fa-child", color: "text-purple-400" }
    ];

    let html = '';
    demoPersonas.forEach(p => {
        html += `
            <div class="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)] text-center hover:bg-white/10 transition-all cursor-pointer hover:scale-105">
                <i class="fas ${p.icon} ${p.color} text-5xl mb-4 drop-shadow-md"></i>
                <h3 class="text-2xl font-black text-white">${p.name}</h3>
                <p class="text-xs text-gray-300 font-bold uppercase tracking-widest mt-2">${p.goal}</p>
                <span class="inline-block mt-4 px-4 py-1.5 bg-white/10 rounded-full text-[10px] text-white font-bold border border-white/20 uppercase tracking-widest">${p.level}</span>
            </div>
        `;
    });
    demoContainer.innerHTML = html;
});