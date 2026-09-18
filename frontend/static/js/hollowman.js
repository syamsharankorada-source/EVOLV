/**
 * HollowMan 6: original faceless 2D exercise demonstrations.
 * Drop-in canvas renderer. Workout plans, timers and APIs are untouched.
 * Movement references: ACE and NASM exercise libraries.
 * https://www.acefitness.org/resources/everyone/exercise-library/
 * https://www.nasm.org/resource-center/exercise-library
 */
(function () {
    'use strict';
    const PI = Math.PI, TAU = PI * 2, GROUND = 184;
    const mix = (a, b, t) => a + (b - a) * t;
    const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
    const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
    const wave = t => (1 - Math.cos(TAU * t)) / 2;
    const pt = (x, y) => ({ x, y });
    const add = (a, b) => pt(a.x + b.x, a.y + b.y);
    const lerp = (a, b, t) => pt(mix(a.x, b.x, t), mix(a.y, b.y, t));
    const polar = (p, length, angle) => pt(p.x + Math.sin(angle) * length, p.y + Math.cos(angle) * length);
    const norm = n => String(n || '').toLowerCase().replace(/[’']/g, '').replace(/[–—_]/g, '-').replace(/\s+/g, ' ').trim();
    const catalog = new Map();
    function register(names, type, cue, options = {}) {
        names.split('|').forEach(name => catalog.set(norm(name), { type, cue, duration: 4, ...options, name }));
    }
    register('Bodyweight Squat|Squats|Squat', 'squat', 'Sit back and down • keep heels planted');
    register('Goblet Squat|Kettlebell Goblet Squat', 'squat', 'Keep the weight at your chest', { load: 'goblet' });
    register('Barbell Back Squat', 'squat', 'Brace • hips and shoulders rise together', { load: 'backbar' });
    register('Barbell Front Squat', 'squat', 'Elbows forward • keep your chest lifted', { load: 'frontbar' });
    register('Overhead Squat', 'squat', 'Keep the bar balanced over the mid-foot', { load: 'overheadbar' });
    register('Resistance Band Squat', 'squat', 'Stand on the band • rise with control', { load: 'squatband' });
    register('Sumo Squat', 'sumo', 'Wide stance • knees follow the toes', { load: 'goblet' });
    register('Assisted Squat', 'squat', 'Use the chair for light balance support', { support: true });
    register('Chair Sit-to-Stand', 'chair', 'Lean forward • stand • sit with control');
    register('Pistol Squat|Weighted Pistol Squat', 'pistol', 'Keep one leg extended • control the descent');
    register('Lunges|Lunge|Dumbbell Lunges|Barbell Walking Lunges', 'lunge', 'Step forward • lower both knees • return');
    register('Reverse Lunge', 'reverse_lunge', 'Step back • keep the front foot planted');
    register('Curtsy Lunge', 'curtsy', 'Step diagonally behind • keep hips controlled');
    register('Bulgarian Split Squat', 'split', 'Rear foot on bench • lower straight down');
    register('Step-up|Box Step-up|Dumbbell Step-up|Weighted Step-up', 'step', 'Whole foot on step • drive up • step down', { duration: 6 });
    register('Standing Calf Raise|Calf Raise|Weighted Calf Raise', 'calf', 'Rise onto your toes • lower your heels');
    register('Wall Sit|Weighted Wall Sit', 'wall_sit', 'Back on wall • hold • breathe steadily', { hold: true });
    register('Push-up|Push-ups|Pushup|Pushups', 'pushup', 'Lower chest and hips together • press up');
    register('Knee Push-up', 'knee_pushup', 'Keep a straight line from knees to head');
    register('Wall Push-up', 'wall_pushup', 'Hands on wall • bend elbows • press away');
    register('Incline Push-up', 'incline_pushup', 'Hands on bench • keep your body aligned');
    register('Diamond Push-up', 'diamond', 'Hands close together • elbows track back');
    register('One-Arm Push-up', 'one_arm', 'Wide feet • one hand supports the body');
    register('Archer Push-up', 'archer', 'Shift to one hand • opposite arm stays long', { duration: 6 });
    register('Plyo Push-up', 'plyo', 'Lower • push explosively • land softly');
    register('Deficit Push-up', 'deficit', 'Hands on blocks • controlled extra depth');
    register('Pike Push-up', 'pike', 'Hips high • lower head between your hands');
    register('Handstand Push-up', 'handstand', 'Wall support • lower and press with control');
    register('Plank', 'plank', 'Elbows below shoulders • hold a straight body', { hold: true });
    register('Plank Shoulder Taps', 'taps', 'Touch opposite shoulder • keep hips still', { duration: 5 });
    register('Side Plank|Side Plank Knee Down', 'side_plank', 'Elbow under shoulder • lift and hold hips', { hold: true });
    register('Bird Dog', 'bird_dog', 'Reach opposite arm and leg • return • switch', { duration: 8 });
    register('Dead Bug', 'dead_bug', 'Lower opposite limbs • keep the back steady', { duration: 8 });
    register('Glute Bridge|Single-Leg Glute Bridge|Barbell Hip Thrust', 'bridge', 'Press through heels • lift hips • lower slowly');
    register('Superman Hold|Superman Row', 'superman', 'Reach long • lift gently • avoid over-arching');
    register('Hollow Body Hold', 'hollow', 'Shoulders and heels lifted • hold and breathe', { hold: true });
    register('Flutter Kicks', 'flutter', 'Small alternating kicks • keep trunk still');
    register('V-Ups', 'vup', 'Lift legs and torso together • lower slowly');
    register('Bicycle Crunch', 'bicycle_crunch', 'Rotate toward the opposite bent knee', { duration: 5 });
    register('Russian Twist|Weighted Russian Twist', 'twist', 'Rotate the ribcage from side to side');
    register('Standing Oblique Crunch', 'oblique', 'Bring knee toward elbow • alternate sides');
    register('Dragon Flag', 'dragon', 'Anchor shoulders • lower body as one unit', { duration: 6 });
    register('L-Sit', 'lsit', 'Press through hands • hold both legs forward', { hold: true });
    register('Tuck Front Lever Hold', 'lever', 'Straight arms • tuck knees • hold body level', { hold: true });
    register('Bodyweight Good Morning', 'hinge', 'Soft knees • hinge at hips • keep back long');
    register('Dumbbell Deadlift|Barbell Deadlift|Kettlebell Deadlift|Barbell Sumo Deadlift', 'deadlift', 'Keep load close • extend hips and knees');
    register('Dumbbell Romanian Deadlift', 'rdl', 'Push hips back • soft knees • stand tall');
    register('Bent-over Dumbbell Row|Barbell Bent-over Row|Kettlebell Row', 'row', 'Hold the hinge • draw elbows toward hips');
    register('Renegade Row', 'renegade', 'Keep hips level • row one weight at a time', { duration: 6 });
    register('Inverted Row', 'inverted_row', 'Body straight • pull chest toward the bar');
    register('Standing Dumbbell Bicep Curl|Bicep Curl|Hammer Curl', 'curl', 'Keep upper arms still • bend at the elbows');
    register('Seated Dumbbell Shoulder Press|Dumbbell Shoulder Press|Barbell Overhead Press|Single-Arm Kettlebell Press', 'press', 'Press above shoulders • lower with control');
    register('Barbell Push Press', 'push_press', 'Small knee dip • drive upward • press');
    register('Overhead Triceps Extension', 'triceps', 'Upper arms steady • bend and extend elbows');
    register('Standing Lateral Raise', 'lateral', 'Soft elbows • raise arms to shoulder height');
    register('Front Raise', 'front_raise', 'Lift in front to shoulder height • lower');
    register('Dumbbell Bench Press|Barbell Bench Press', 'bench_press', 'Lower toward chest • press over shoulders');
    register('Dumbbell Chest Fly', 'fly', 'Soft elbows • open wide • bring arms together');
    register('Skull Crushers', 'skull', 'Keep upper arms steady • bend only elbows');
    register('Tricep Dips|Weighted Dip', 'dip', 'Bend elbows backward • press through hands');
    register('Pull-up|Chin-up|Weighted Pull-up', 'pullup', 'Pull chest toward bar • lower with control');
    register('Muscle-up', 'muscleup', 'Pull high • transition over bar • press', { duration: 7 });
    register('Resistance Band Pull-Apart', 'pullapart', 'Arms at shoulder height • open the band');
    register('Resistance Band Row|Face Pull', 'band_row', 'Pull against anchor • control the return');
    register('Resistance Band Chest Press', 'band_press', 'Anchor behind • press forward • return');
    register('Kettlebell Swing', 'swing', 'Hinge back • drive hips • let the bell float');
    register('Kettlebell Clean|Kettlebell Snatch|Barbell Clean and Press', 'clean', 'Hip drive • keep load close • control return', { duration: 6 });
    register('Turkish Get-up', 'getup', 'Roll • post hand • sweep leg • kneel • stand', { duration: 16 });
    register('Walking|Farmers Carry Light|Heel-to-Toe Walk|Marching in Place|Sprint Intervals|High Knees', 'gait', 'Alternate legs with the opposite arm', { duration: 3.2 });
    register('Jumping Jacks', 'jacks', 'Jump feet apart as arms rise • return together', { duration: 2.6 });
    register('Jump Rope', 'rope', 'Small soft hops • turn rope from the wrists', { duration: 1.8 });
    register('Mountain Climbers', 'climbers', 'Hands planted • alternate knees toward chest', { duration: 3.6 });
    register('Burpees', 'burpee', 'Squat • plank • feet in • jump • land softly', { duration: 7 });
    register('Jump Squat|Jump Lunge', 'jump', 'Load • jump • land with soft knees', { duration: 3.5 });
    register('Box Jump|High Box Jump|Depth Jump', 'box_jump', 'Prepare • jump • absorb landing • reset', { duration: 7 });
    register('Cycling|Stationary Bike Sprint', 'bike', 'Smooth circular pedalling • steady upper body', { duration: 2.8 });
    register('Shadow Boxing', 'boxing', 'Guard up • alternate punches • return to guard');
    register('Battle Rope Slams', 'battle', 'Raise ropes • bend hips and knees • slam');
    register('Side Leg Raise|Standing Hip Abduction', 'abduction', 'Keep torso upright • lift the leg sideways');
    register('Lateral Band Walk', 'band_walk', 'Small side steps • keep tension in the band', { duration: 6 });
    register('Arm Circles', 'circles', 'Small controlled circles from the shoulders');
    register('Ankle Circles', 'ankles', 'Lift one foot • circle the ankle • switch', { duration: 8 });
    register('Neck Mobility', 'neck', 'Slow gentle head turns • keep shoulders still', { duration: 8 });
    register('Gentle Mobility Routine', 'mobility', 'Easy shoulder rolls • gentle alternating steps', { duration: 8 });
    register('Toe Touches', 'toe_touch', 'Hinge forward gently • return with control', { duration: 6 });
    register('Seated Forward Bend', 'seated_bend', 'Reach forward gently • keep the spine long', { duration: 8 });
    register("Child's Pose", 'child', 'Sit hips toward heels • reach arms forward', { hold: true });
    register('Cat-Cow Stretch', 'catcow', 'Round the back • gently open the chest', { duration: 7 });
    register('Wall Angels', 'angels', 'Back at wall • slide arms up and down slowly', { duration: 6 });

    // Fixed-length two-bone IK prevents rubber limbs between poses.
    function ik(root, target, a, b, bend = 1) {
        let dx = target.x - root.x, dy = target.y - root.y;
        const raw = Math.hypot(dx, dy);
        if (raw < .0001) { dx = 0; dy = 1; }
        const d = clamp(raw, Math.abs(a - b) + .001, a + b - .001);
        const ux = dx / (raw || 1), uy = dy / (raw || 1);
        const along = (a*a - b*b + d*d) / (2*d);
        const out = Math.sqrt(Math.max(0, a*a - along*along)) * bend;
        return [pt(root.x + ux*along - uy*out, root.y + uy*along + ux*out), pt(root.x + ux*d, root.y + uy*d)];
    }
    function base(front = false) {
        return { hip: pt(120,120), angle: 0, front: front ? 1 : 0,
            hands: [pt(113,123),pt(127,123)], feet: front ? [pt(111,179),pt(129,179)] : [pt(115,179),pt(125,179)],
            armBend: [-1,-1], legBend: front ? [1,-1] : [-1,-1], shoe: [0,0], headTilt: 0, curve: 0,
            scene: '', phase: 'Set up' };
    }
    function torso(p) { return pt(p.hip.x + Math.sin(p.angle)*44, p.hip.y - Math.cos(p.angle)*44); }
    function armsDown(p) {
        const s=torso(p), width=mix(4,17,p.front);
        p.hands=[pt(s.x-width-1,s.y+47),pt(s.x+width+1,s.y+47)]; return p;
    }
    function reach(p,left,right) { p.hands=[left,right || add(left,pt(6,0))]; return p; }
    function blend(a,b,t) {
        const out={...a};
        for(const k of ['angle','front','headTilt','curve']) out[k]=mix(a[k],b[k],t);
        out.hip=lerp(a.hip,b.hip,t);
        for(const k of ['hands','feet']) out[k]=a[k].map((v,i)=>lerp(v,b[k][i],t));
        out.shoe=a.shoe.map((v,i)=>mix(v,b.shoe[i],t)); out.phase=b.phase; return out;
    }
    function sequence(keys,phase) {
        const q=((phase%1)+1)%1;
        for(let i=1;i<keys.length;i++) if(q<=keys[i][0]) return blend(keys[i-1][1],keys[i][1],smooth((q-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));
        return keys[0][1];
    }
    function squat(t,spec) {
        const p=base(spec.type==='sumo'); p.hip=pt(120-22*t,120+31*t); p.angle=.52*t;
        if(spec.type==='sumo') {p.hip.x=120;p.angle=0;p.feet=[pt(90,179),pt(150,179)];p.legBend=[1,-1];}
        const s=torso(p); reach(p,pt(s.x+43,s.y+2));p.armBend=[1,1];
        if(spec.load==='goblet') reach(p,pt(s.x+13,s.y+8));
        if(/bar$/.test(spec.load||'')) {const high=spec.load==='overheadbar';p.front=.55;reach(p,pt(s.x-23,s.y-(high?44:0)),pt(s.x+23,s.y-(high?44:0)));p.armBend=[-1,1];}
        if(spec.load==='squatband') {p.front=.55;reach(p,pt(s.x-18,s.y+2),pt(s.x+18,s.y+2));}
        if(spec.support) {p.scene='support';reach(p,pt(154,107));} return p;
    }
    function floor(t=0,knee=false,incline=0) {
        const p=base(), anchor=pt(knee?104:61,179), slope=mix(.43+incline*.012,.10+incline*.012,t);
        p.hip=pt(anchor.x+Math.cos(slope)*(knee?26:56),anchor.y-Math.sin(slope)*(knee?26:56));
        p.angle=PI/2-slope;p.feet=[anchor,add(anchor,pt(-5,-2))];p.hands=[pt(incline?143:157,181-incline),pt(incline?149:163,181-incline)];
        p.armBend=[1,1];p.legBend=[1,1];p.shoe=[-.9,-.9];p.scene=incline?'incline':'mat';p.kneeling=knee;return p;
    }
    function supine() {
        const p=base();p.hip=pt(121,170);p.angle=-PI/2;p.feet=[pt(174,179),pt(180,176)];p.hands=[pt(113,180),pt(119,178)];
        p.legBend=[-1,-1];p.armBend=[1,1];p.scene='mat';return p;
    }
    function quadruped() {
        const p=base();p.hip=pt(106,148);p.angle=1.30;p.hands=[pt(147,181),pt(154,181)];p.feet=[pt(80,179),pt(87,177)];
        p.legBend=[-1,-1];p.armBend=[1,1];p.scene='mat';p.quadruped=true;return p;
    }
    function lunge(t,reverse=false,split=false,front=false) {
        const p=base(front);p.hip=pt(120,124+28*t);p.angle=.10*t;
        p.feet=[pt(mix(114,83,split?1:t),split?145:179),pt(mix(127,151,reverse?0:t),179)];
        if(reverse)p.feet[0].x=mix(114,78,t);p.legBend=[1,-1];p.shoe[0]=-.5*t;
        if(split)p.scene='splitbench';return armsDown(p);
    }
    function poseFor(spec,phase) {
        const n=norm(spec.name),t=wave(phase),alt=Math.sin(TAU*phase),left=Math.max(0,alt),right=Math.max(0,-alt);
        let p=base();
        switch(spec.type) {
        case 'squat':case 'sumo':p=squat(t,spec);break;
        case 'chair':p=squat(1-t,spec);p.scene='chair';p.phase=t<.1?'Sit':phase<.5?'Stand up':'Sit down';break;
        case 'pistol':p=squat(t,spec);p.feet[1]=pt(mix(127,155,t),mix(179,150,t));break;
        case 'lunge':case 'reverse_lunge':case 'split':case 'curtsy':
            p=lunge(t,spec.type==='reverse_lunge',spec.type==='split',spec.type==='curtsy');
            if(spec.type==='curtsy'){p.feet=[pt(mix(112,143,t),178),pt(131,180)];p.legBend=[1,-1];}break;
        case 'step':{
            const a=base(),b=base(),c=base();
            a.hip=pt(99,124);a.feet=[pt(94,179),pt(105,179)];armsDown(a);
            b.hip=pt(108,124);b.feet=[pt(94,179),pt(140,147)];armsDown(b);
            c.hip=pt(140,92);c.feet=[pt(135,147),pt(145,147)];armsDown(c);
            a.scene=b.scene=c.scene='step';a.phase='Step down';b.phase='Place whole foot';c.phase='Stand on step';
            p=sequence([[0,a],[.18,b],[.45,c],[.58,c],[.82,b],[1,a]],phase);break;
        }
        case 'calf':p.hip.y-=7*t;p.feet.forEach(f=>f.y-=7*t);p.shoe=[.5*t,.5*t];armsDown(p);break;
        case 'wall_sit':p.hip=pt(97,148);p.feet=[pt(129,179),pt(136,179)];reach(p,pt(126,143));p.scene='wall';break;
        case 'pushup':case 'diamond':case 'one_arm':case 'deficit':case 'plyo':case 'archer':case 'knee_pushup':case 'incline_pushup':
            p=floor(t,spec.type==='knee_pushup',spec.type==='incline_pushup'?35:spec.type==='deficit'?9:0);
            if(spec.type==='diamond')p.hands=[pt(164,181),pt(166,181)];
            if(spec.type==='one_arm')p.hands[0]=add(p.hip,pt(-5,-10));
            if(spec.type==='deficit')p.scene='blocks';
            if(spec.type==='archer'){p.front=.75;p.hands=[pt(139,181),pt(200,181)];p.hip.x+=10*alt;p.armBend=[1,-1];}
            if(spec.type==='plyo'){const lift=8*Math.pow(Math.max(0,Math.cos(TAU*phase)),6);p.hip.y-=lift;p.hands.forEach(h=>h.y-=lift);}break;
        case 'wall_pushup':p.angle=.37+.23*t;p.hip=pt(121+Math.sin(p.angle)*59,179-Math.cos(p.angle)*59);p.feet=[pt(119,179),pt(125,179)];p.hands=[pt(202,94),pt(202,96)];p.armBend=[1,1];p.scene='pushwall';break;
        case 'pike':p=floor(t);p.hip=pt(119,116+8*t);p.angle=2.2;p.feet=[pt(80,179),pt(86,179)];break;
        case 'handstand':p.hip=pt(139,91+13*t);p.angle=PI;p.feet=[pt(145,35+13*t),pt(151,35+13*t)];
            p.hands=[pt(128,181),pt(149,181)];p.armBend=[1,-1];p.legBend=[1,1];p.scene='handwall';break;
        case 'plank':p=floor(.45);p.hands=[pt(180,181),pt(186,179)];p.forearms=true;break;
        case 'taps':case 'renegade':p=floor(0);p.hands[0]=lerp(p.hands[0],spec.type==='taps'?pt(163,143):pt(133,146),left);
            p.hands[1]=lerp(p.hands[1],spec.type==='taps'?pt(149,143):pt(138,144),right);break;
        case 'side_plank':p=base(true);p.front=.7;p.hip=pt(120,159);p.angle=1.25;p.feet=[pt(63,177),pt(66,179)];
            p.hands=[pt(157,86),pt(190,181)];p.armBend=[1,1];p.legBend=[1,1];p.scene='mat';p.sideSupport=true;
            if(n.includes('knee')){p.feet=[pt(75,179),pt(81,179)];p.sideKnee=true;}break;
        case 'bird_dog':p=quadruped();p.hands[0]=lerp(p.hands[0],pt(197,144),left);p.feet[1]=lerp(p.feet[1],pt(49,145),left);
            p.hands[1]=lerp(p.hands[1],pt(201,144),right);p.feet[0]=lerp(p.feet[0],pt(45,145),right);p.extension=[right,left];break;
        case 'dead_bug':p=supine();p.hands=[pt(77,123),pt(83,121)];p.feet=[pt(151,140),pt(155,137)];
            p.hands[0]=lerp(p.hands[0],pt(33,166),left);p.feet[1]=lerp(p.feet[1],pt(182,163),left);
            p.hands[1]=lerp(p.hands[1],pt(38,164),right);p.feet[0]=lerp(p.feet[0],pt(178,165),right);break;
        case 'bridge':{
            p=supine();const thrust=n.includes('thrust'),rise=thrust?mix(-11,5,t):24*t,sy=thrust?138:169;
            p.hip=pt(77+Math.sqrt(44*44-rise*rise),sy-rise);p.angle=-PI/2-Math.asin(rise/44);
            p.head=pt(58,sy+1);p.headAngle=-PI/2;p.feet=[pt(146,179),pt(154,179)];p.armAngles=[[1.42,1.42],[1.42,1.42]];
            if(n.includes('single'))p.feet[0]=pt(p.hip.x+57,p.hip.y-8);if(thrust)p.scene='hipbench';break;
        }
        case 'superman':p=quadruped();p.quadruped=false;p.hip=pt(120,168);p.angle=PI/2-.08;p.feet=[pt(61,164-7*t),pt(66,167-7*t)];
            p.hands=[pt(204,157-5*t),pt(211,161-5*t)];p.legBend=[1,1];if(n.includes('row'))reach(p,pt(203-34*t,155+8*t));break;
        case 'hollow':case 'flutter':case 'vup':case 'bicycle_crunch':case 'twist':{
            p=supine();const lift=spec.type==='vup'?t:spec.type==='twist'?.65:.18;p.hip=pt(120,172);p.angle=-1.35+.8*lift;
            p.feet=[pt(175-18*lift,157-44*lift),pt(181-18*lift,158-44*lift)];const s=torso(p);reach(p,pt(s.x-39,s.y-15));
            if(spec.type==='flutter'){p.feet[0].y-=9*alt;p.feet[1].y+=9*alt;}
            if(spec.type==='vup')reach(p,pt(mix(41,138,t),mix(156,116,t)));
            if(spec.type==='bicycle_crunch'){p.feet=[pt(160-30*left,151-30*left),pt(165-30*right,153-30*right)];reach(p,pt(s.x-10,s.y-6));p.front=.25+.18*alt;}
            if(spec.type==='twist'){p.front=.45+.3*alt;p.feet=[pt(157,175),pt(165,175)];reach(p,pt(113+21*alt,143),pt(121+21*alt,143));}break;
        }
        case 'oblique':p=base(true);p.angle=.16*alt;p.feet=[pt(106-10*left,179-33*left),pt(134+10*right,179-33*right)];
            reach(p,pt(103,66),pt(137,66));p.armBend=[1,-1];p.legBend=[1,-1];break;
        case 'dragon':{
            p=supine();const a=mix(.15,1.05,t);p.hip=pt(82+44*Math.cos(a),148-44*Math.sin(a));p.angle=-PI/2-a;p.head=pt(63,148);p.headAngle=-PI/2;
            p.feet=[pt(p.hip.x+56*Math.cos(a),p.hip.y-56*Math.sin(a)),pt(p.hip.x+60*Math.cos(a),p.hip.y-60*Math.sin(a))];
            p.hands=[pt(57,149),pt(64,149)];p.scene='bench';break;
        }
        case 'lsit':p.hip=pt(104,150);p.feet=[pt(162,153),pt(168,153)];p.hands=[pt(103,153),pt(113,153)];p.scene='parallettes';break;
        case 'lever':p.hip=pt(112,112);p.angle=PI/2;p.hands=[pt(157,65),pt(167,65)];p.feet=[pt(107,123),pt(112,124)];p.scene='lowbar';break;
        default:return secondaryPose(spec,phase);
        }
        if(n.includes('barbell walking')){const s=torso(p);p.front=.4;reach(p,pt(s.x-23,s.y),pt(s.x+23,s.y));p.armBend=[-1,1];}
        if(spec.type==='deficit')p.hands=[pt(157,172),pt(163,172)];
        if(p.phase==='Set up')p.phase=spec.hold?'Hold & breathe':phase<.08?'Set up':phase<.5?'Move with control':'Return with control';
        return p;
    }

    function secondaryPose(spec,phase) {
        const n=norm(spec.name),t=wave(phase),alt=Math.sin(TAU*phase),left=Math.max(0,alt),right=Math.max(0,-alt);
        let p=base();
        switch(spec.type) {
        case 'hinge':case 'deadlift':case 'rdl':case 'row':case 'toe_touch': {
            const q=spec.type==='row'?.85:t,deep=spec.type==='deadlift';
            p.hip=pt(120-15*q,124+(deep?20:7)*q);p.angle=(spec.type==='toe_touch'?1.3:1.05)*q;armsDown(p);
            if(spec.type==='hinge'){const s=torso(p);reach(p,pt(s.x-3,s.y-6));}
            if(spec.type==='row'){const s=torso(p);reach(p,pt(s.x-21*t,s.y+43-22*t));p.armBend=[1,1];}
            if(n.includes('sumo')){p.front=.6;p.feet=[pt(95,179),pt(143,179)];p.legBend=[1,-1];}break;
        }
        case 'curl': {
            p=base(true);const s=torso(p);p.armAngles=[[.06,mix(.08,-2.55,t)],[-.06,mix(-.08,2.55,t)]];
            reach(p,pt(s.x-18,s.y+44),pt(s.x+18,s.y+44));break;
        }
        case 'press':case 'push_press':case 'triceps':case 'lateral':case 'front_raise':case 'pullapart':case 'angels': {
            p=base(spec.type!=='front_raise');
            if(n.includes('seated')){p.hip.y=147;p.feet=[pt(103,179),pt(139,179)];p.scene='presschair';}
            if(spec.type==='push_press')p.hip.y+=6*Math.pow(1-t,4);
            const s=torso(p);p.armBend=[-1,1];
            reach(p,pt(s.x-33+12*t,s.y-5-41*t),pt(s.x+33-12*t,s.y-5-41*t));
            if(n.includes('single-arm'))p.hands[0]=pt(s.x-22,s.y+42);
            if(spec.type==='triceps'){p.front=0;p.armAngles=[[PI+.04,mix(0,PI,t)],[PI-.04,mix(0,PI,t)]];}
            if(spec.type==='lateral'){p.armAngles=[[-1.48*t,-1.55*t],[1.48*t,1.55*t]];}
            if(spec.type==='front_raise'){p.armAngles=[[1.5*t,1.52*t],[1.5*t,1.52*t]];}
            if(spec.type==='pullapart'){reach(p,pt(110-53*t,81),pt(130+53*t,81));p.armBend=[1,-1];p.projectArms=true;}
            if(spec.type==='angels')p.scene='angelwall';break;
        }
        case 'band_row':case 'band_press': {
            const press=spec.type==='band_press',face=n.includes('face');p.angle=.08;const s=torso(p);
            reach(p,pt(s.x+mix(44,face?7:4,press?1-t:t),s.y+(face?-5:12)));p.armBend=[1,1];p.scene=press?'bandback':'bandfront';break;
        }
        case 'bench_press':case 'fly':case 'skull': {
            p=supine();p.hip=pt(123,146);p.feet=[pt(158,179),pt(166,179)];p.scene='bench';
            const s=torso(p);reach(p,pt(s.x+4,s.y-12-33*t),pt(s.x+12,s.y-12-33*t));
            if(spec.type==='fly'){p.front=.8;reach(p,pt(s.x-44*(1-t),s.y-9-34*t),pt(s.x+44*(1-t),s.y-9-34*t));p.armBend=[1,-1];p.projectArms=true;}
            if(spec.type==='skull')p.armAngles=[[PI,mix(-PI/2,-PI,t)],[PI,mix(-PI/2,-PI,t)]];break;
        }
        case 'dip':p.hip=pt(127,132+20*t);p.feet=[pt(170,179),pt(177,179)];p.hands=[pt(112,128),pt(119,128)];p.scene='dipbench';p.armBend=[1,1];break;
        case 'pullup':case 'muscleup': {
            p=base(true);let rise=33*t;
            if(spec.type==='muscleup')rise=wave(phase)*66;
            p.hip=pt(120,148-rise);p.hands=[pt(n.includes('chin')?103:91,65),pt(n.includes('chin')?137:149,65)];
            p.feet=[pt(107,194-rise),pt(130,194-rise)];p.armBend=[-1,1];p.legBend=[1,-1];p.scene='pullbar';
            p.phase=spec.type==='muscleup'&&t>.58?'Transition & press':phase<.5?'Pull up':'Lower slowly';break;
        }
        case 'inverted_row':p=supine();p.hip=pt(120,157-11*t);p.angle=-1.1+.12*t;p.feet=[pt(172,179),pt(178,179)];
            p.hands=[pt(82,95),pt(93,95)];p.scene='rowbar';break;
        case 'swing': {
            p.hip=pt(120-17*(1-t),124+9*(1-t));p.angle=1.0*(1-t);const s=torso(p);
            reach(p,polar(s,44,mix(-.23,1.55,t)));p.armBend=[-1,-1];break;
        }
        case 'clean': {
            const a=base(),b=base(),c=base();a.hip=pt(105,139);a.angle=.95;armsDown(a);
            b.hip=pt(120,128);reach(b,pt(126,82));c.hip=pt(120,124);reach(c,pt(123,36));
            if(n.includes('barbell')){a.front=b.front=c.front=.45;reach(b,pt(105,82),pt(141,82));reach(c,pt(102,36),pt(138,36));}
            else {a.hands[0]=pt(114,142);b.hands[0]=pt(110,124);c.hands[0]=pt(110,124);}
            a.phase='Hinge & load';b.phase='Catch at shoulder';c.phase='Stand & lock out';
            p=n.includes('snatch')?sequence([[0,a],[.42,c],[.58,c],[1,a]],phase):n.includes('press')?sequence([[0,a],[.25,b],[.5,c],[.62,c],[.8,b],[1,a]],phase):sequence([[0,a],[.4,b],[.6,b],[1,a]],phase);break;
        }
        case 'getup': {
            const a=supine(),b=base(),c=base(),d=base(),e=base();
            a.feet=[pt(143,179),pt(180,179)];a.hands=[pt(96,179),pt(82,124)];
            b.hip=pt(113,166);b.angle=-.55;b.feet=[pt(145,179),pt(172,179)];b.hands=[pt(77,180),pt(96,84)];
            c.hip=pt(111,146);c.angle=-.35;c.feet=[pt(88,178),pt(145,179)];c.hands=[pt(75,179),pt(101,60)];
            d.hip=pt(119,143);d.feet=[pt(89,179),pt(147,179)];d.legBend=[1,-1];d.hands=[pt(106,134),pt(126,54)];
            e.hands=[pt(111,124),pt(125,36)];
            for(const q of [a,b,c,d,e])q.scene='mat';
            a.phase='Lie back • weight above shoulder';b.phase='Roll up • post free hand';c.phase='Lift hips • sweep leg under';d.phase='Half kneel • torso upright';e.phase='Stand • reverse the steps';
            p=sequence([[0,a],[.12,b],[.23,c],[.34,d],[.45,e],[.55,e],[.66,d],[.77,c],[.88,b],[1,a]],phase);break;
        }
        case 'gait': {
            const high=n.includes('high')||n.includes('march'),run=n.includes('sprint'),tandem=n.includes('heel');
            p.hip.y-=run?4*Math.abs(alt):0;p.angle=run?.12:0;
            const stride=tandem?10:high?10:run?24:18;
            p.feet=[pt(116+stride*alt,179-(high?30:run?18:8)*left),pt(125-stride*alt,179-(high?30:run?18:8)*right)];
            const s=torso(p);reach(p,pt(s.x-4-17*alt,s.y+32),pt(s.x+5+17*alt,s.y+32));
            if(n.includes('carry'))armsDown(p);p.shoe=[-.3*left,-.3*right];break;
        }
        case 'jacks':p=base(true);p.hip.y-=5*Math.abs(alt);p.feet=[pt(111-25*t,179-5*Math.abs(alt)),pt(129+25*t,179-5*Math.abs(alt))];
            p.armAngles=[[-2.65*t,-2.75*t],[2.65*t,2.75*t]];p.legBend=[1,-1];break;
        case 'rope':p=base(true);p.hip.y-=8*t;p.feet.forEach(f=>f.y-=8*t);reach(p,pt(89,112),pt(151,112));p.armBend=[1,-1];p.scene='rope';break;
        case 'climbers':p=floor(0);p.feet=[lerp(pt(61,179),pt(135,171),left),lerp(pt(57,177),pt(131,169),right)];p.legBend=[-1,-1];break;
        case 'burpee': {
            const a=armsDown(base()),b=squat(1,spec),c=floor(0),d=base();
            b.hip=pt(130,147);b.angle=.9;b.hands=[pt(164,181),pt(171,181)];b.feet=[pt(121,179),pt(132,179)];
            d.hip.y=101;d.feet=[pt(113,154),pt(125,154)];reach(d,pt(110,18),pt(130,18));
            a.scene=b.scene=c.scene=d.scene='mat';a.phase='Stand & land';b.phase='Squat • hands down';c.phase='Jump feet back • plank';d.phase='Jump & reach';
            p=sequence([[0,a],[.18,b],[.36,c],[.48,c],[.65,b],[.83,d],[1,a]],phase);break;
        }
        case 'jump': {
            const a=spec.name==='Jump Lunge'?lunge(.8):squat(.75,spec),b=base();
            b.hip.y=103;b.feet=[pt(114,157),pt(127,157)];reach(b,pt(108,58),pt(131,58));a.phase='Land softly & load';b.phase='Jump';
            p=sequence([[0,a],[.4,b],[.6,b],[1,a]],phase);break;
        }
        case 'box_jump': {
            const a=squat(.6,spec),b=base(),c=squat(.65,spec),d=base();
            a.hip.x-=27;a.feet.forEach(f=>f.x-=27);a.hands.forEach(h=>h.x-=27);
            b.hip=pt(134,82);b.feet=[pt(131,130),pt(144,130)];reach(b,pt(138,53));
            c.hip=pt(143,130);c.feet=[pt(151,151),pt(161,151)];reach(c,pt(164,101));
            d.hip=pt(154,96);d.feet=[pt(150,151),pt(160,151)];armsDown(d);
            a.scene=b.scene=c.scene=d.scene='box';a.phase='Load on floor';b.phase='Jump onto box';c.phase='Absorb landing';d.phase='Stand tall • step down';
            p=sequence([[0,a],[.25,b],[.4,c],[.55,d],[.7,d],[1,a]],phase);
            if(n.includes('depth'))p=sequence([[0,d],[.22,c],[.43,a],[.62,b],[.8,c],[1,d]],phase);break;
        }
        case 'bike':p.hip=pt(109,125);p.angle=.6;reach(p,pt(161,105));p.feet=[pt(132+15*Math.cos(TAU*phase),157+15*Math.sin(TAU*phase)),pt(132-15*Math.cos(TAU*phase),157-15*Math.sin(TAU*phase))];p.scene='bike';break;
        case 'boxing':p.hip=pt(120,128);p.angle=.09*alt;p.feet=[pt(103,179),pt(139,179)];reach(p,pt(132+32*left,69+4*left),pt(139+32*right,72+4*right));break;
        case 'battle':p=squat(t,spec);reach(p,pt(143,57+93*t),pt(156,57+93*t));p.scene='battle';break;
        case 'abduction':p=base(true);p.legAngles=[[0,0],[.55*t,.55*t]];p.legBend=[1,-1];armsDown(p);
            if(n.includes('side leg')){p.hands[0]=pt(82,107);p.scene='legchair';}break;
        case 'band_walk':p=base(true);p.hip=pt(120+8*alt,135);p.feet=[pt(102+16*left-8*right,179),pt(138+8*left-16*right,179)];p.legBend=[1,-1];reach(p,pt(113+8*alt,106),pt(127+8*alt,106));break;
        case 'circles':p=base(true);p.armAngles=[[-PI/2+.17*Math.cos(TAU*phase),-PI/2+.17*Math.sin(TAU*phase)],[PI/2-.17*Math.cos(TAU*phase),PI/2-.17*Math.sin(TAU*phase)]];break;
        case 'ankles':p=armsDown(base(true));p.feet[phase<.5?0:1].y-=9;p.shoe=[phase<.5?.6*Math.sin(TAU*phase*2):0,phase>=.5?.6*Math.sin(TAU*phase*2):0];break;
        case 'neck':p=armsDown(base(true));p.headTilt=.17*alt;break;
        case 'mobility':p=armsDown(base(true));p.feet=[pt(111,179-10*left),pt(129,179-10*right)];p.hands[0].y-=5*t;p.hands[1].y-=5*t;break;
        case 'seated_bend':p=supine();p.hip=pt(98,169);p.angle=.15+.75*t;p.feet=[pt(157,179),pt(162,177)];reach(p,pt(133+26*t,142+22*t));break;
        case 'child':p=quadruped();p.quadruped=false;p.foldedKneel=true;p.hip=pt(89,164);p.angle=1.45;p.hands=[pt(176,181),pt(183,178)];p.feet=[pt(75,180),pt(82,178)];p.legBend=[-1,-1];break;
        case 'catcow':p=quadruped();p.curve=9*alt;p.headTilt=.2*alt;break;
        default:p=armsDown(base(true));p.phase='Demonstration unavailable';break;
        }
        if(p.phase==='Set up')p.phase=spec.hold?'Hold & breathe':phase<.08?'Set up':phase<.5?'Move with control':'Return with control';
        return p;
    }

    function rig(p) {
        const s=torso(p),normal=pt(Math.cos(p.angle),Math.sin(p.angle));
        const sw=mix(2,17,p.front),hw=mix(2,8,p.front);
        const j={hip:p.hip,chest:s,head:p.head||pt(s.x+Math.sin(p.angle)*19,s.y-Math.cos(p.angle)*19),arms:[],legs:[]};
        for(let i=0;i<2;i++){
            const sign=i===0?-1:1,shoulder=add(s,pt(normal.x*sw*sign,normal.y*sw*sign));
            const hip=add(p.hip,pt(normal.x*hw*sign,normal.y*hw*sign));
            let [elbow,hand]=ik(shoulder,p.hands[i],24,23,p.armBend[i]);
            if(p.armAngles){elbow=polar(shoulder,24,p.armAngles[i][0]);hand=polar(elbow,23,p.armAngles[i][1]);}
            if(p.forearms){elbow=polar(shoulder,24,0);hand=add(elbow,pt(23,0));}
            if(p.sideSupport&&i===1){elbow=polar(shoulder,24,0);hand=add(elbow,pt(23,0));}
            // Front-on reach uses projected limb lengths (depth is foreshortened).
            if(p.projectArms){elbow=lerp(shoulder,p.hands[i],.52);hand=p.hands[i];}
            let [knee,ankle]=ik(hip,p.feet[i],31,28,p.legBend[i]);
            if(p.legAngles){knee=polar(hip,31,p.legAngles[i][0]);ankle=polar(knee,28,p.legAngles[i][1]);}
            if(p.kneeling){knee=pt(103+i*5,179);ankle=pt(77+i*5,169);}
            if(p.quadruped){knee=polar(hip,31,-PI/2*(p.extension?.[i]||0));ankle=polar(knee,28,-PI/2);}
            if(p.foldedKneel){knee=polar(hip,31,PI/3);ankle=polar(knee,28,-PI/2);}
            if(p.sideKnee){[knee,ankle]=ik(hip,pt(77+i*5,178),31,28,-1);}
            j.arms.push({root:shoulder,mid:elbow,end:hand});j.legs.push({root:hip,mid:knee,end:ankle});
        }
        return j;
    }
    const colors={skin:'#DDA078',skinLight:'#F0B992',skinDark:'#B87754',red:'#E52F39',redDark:'#AB1625',shorts:'#20242B',edge:'#24242B'};
    function line(ctx,a,b,color,width){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();}
    function ellipse(ctx,p,rx,ry,color,angle=0){ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,angle,0,TAU);ctx.fillStyle=color;ctx.fill();}
    function box(ctx,x,y,w,h,color,r=3){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
    function limb(ctx,a,b,wa,wb,back=false,color=null){
        const d=Math.hypot(b.x-a.x,b.y-a.y)||1,n=pt(-(b.y-a.y)/d,(b.x-a.x)/d);
        ctx.beginPath();ctx.moveTo(a.x+n.x*wa,a.y+n.y*wa);ctx.lineTo(b.x+n.x*wb,b.y+n.y*wb);
        ctx.quadraticCurveTo(b.x+(b.x-a.x)*wb/d,b.y+(b.y-a.y)*wb/d,b.x-n.x*wb,b.y-n.y*wb);
        ctx.lineTo(a.x-n.x*wa,a.y-n.y*wa);ctx.quadraticCurveTo(a.x-(b.x-a.x)*wa/d,a.y-(b.y-a.y)*wa/d,a.x+n.x*wa,a.y+n.y*wa);
        ctx.closePath();ctx.fillStyle=color||(back?colors.skinDark:colors.skin);ctx.fill();
        if(!color&&!back)line(ctx,add(lerp(a,b,.12),pt(n.x*wa*.42,n.y*wa*.42)),add(lerp(a,b,.78),pt(n.x*wb*.4,n.y*wb*.4)),colors.skinLight,1.5);
    }
    function shoe(ctx,a,angle,back){
        ctx.save();ctx.translate(a.x,a.y);ctx.rotate(angle);
        ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(3,-5);ctx.quadraticCurveTo(5,-1,11,0);ctx.quadraticCurveTo(16,1,15,5);
        ctx.lineTo(-6,5);ctx.quadraticCurveTo(-8,1,-5,-5);ctx.closePath();ctx.fillStyle=back?colors.redDark:colors.red;ctx.fill();
        line(ctx,pt(-5,4),pt(14,4),back?'#C6CAD1':'#F2F3F5',1.6);line(ctx,pt(3,-1),pt(7,0),'#FFADAD',1.3);
        ctx.restore();
    }
    function drawLeg(ctx,leg,p,i){
        const back=i===0;limb(ctx,leg.root,leg.mid,7.3,5.5,back);limb(ctx,leg.mid,leg.end,5.2,3.1,back);
        limb(ctx,leg.root,lerp(leg.root,leg.mid,.57),8.1,7.1,back,back?'#11151C':colors.shorts);
        line(ctx,lerp(leg.root,leg.mid,.56),lerp(leg.root,leg.mid,.60),back?'#30353E':'#454B56',1.4);
        shoe(ctx,leg.end,p.shoe[i],back);
    }
    function drawArm(ctx,arm,i){limb(ctx,arm.root,arm.mid,5.5,4.1,i===0);limb(ctx,arm.mid,arm.end,4.1,2.8,i===0);ellipse(ctx,arm.end,3.3,3.7,i===0?colors.skinDark:colors.skin);}
    function drawBody(ctx,p,j){
        const sw=mix(11.5,18,p.front),ww=mix(8.5,11,p.front);
        line(ctx,j.chest,j.head,colors.skinDark,7);
        ctx.save();ctx.translate(j.chest.x,j.chest.y);ctx.rotate(p.angle);
        // Deltoids and the neck remain visible around the sleeveless vest.
        box(ctx,-4.4,-10,8.8,13,colors.skinDark,3);
        ctx.beginPath();ctx.moveTo(-sw,-1);ctx.quadraticCurveTo(-sw-2,9,-ww+p.curve,31);ctx.lineTo(-ww,44);
        ctx.quadraticCurveTo(0,48,ww,44);ctx.lineTo(ww,31);ctx.quadraticCurveTo(sw+2,8,sw,-1);
        ctx.lineTo(6,-3);ctx.quadraticCurveTo(0,7,-6,-3);ctx.closePath();
        const vest=ctx.createLinearGradient(-sw,0,sw,0);vest.addColorStop(0,colors.redDark);vest.addColorStop(.45,colors.red);vest.addColorStop(1,'#F14B4D');ctx.fillStyle=vest;ctx.fill();
        ctx.beginPath();ctx.moveTo(-6,-3);ctx.quadraticCurveTo(0,7,6,-3);ctx.strokeStyle='#8F1421';ctx.lineWidth=1.8;ctx.stroke();
        ctx.beginPath();ctx.moveTo(-sw+4,12);ctx.quadraticCurveTo(-3,17,sw-5,13);ctx.strokeStyle='rgba(133,14,27,.27)';ctx.lineWidth=1;ctx.stroke();
        line(ctx,pt(ww-3,25),pt(ww-4,38),'rgba(255,160,160,.42)',1.4);
        box(ctx,-ww-1,41,ww*2+2,7,colors.shorts,2);line(ctx,pt(-ww,43),pt(ww,43),'#3A414C',1.5);
        ctx.restore();
        ctx.save();ctx.translate(j.head.x,j.head.y);ctx.rotate((p.headAngle??p.angle)+p.headTilt);
        // Featureless head: intentionally no eyes, mouth, nose, ears or hair.
        const skin=ctx.createLinearGradient(-9,0,9,0);skin.addColorStop(0,colors.skinDark);skin.addColorStop(.5,colors.skin);skin.addColorStop(1,colors.skinLight);
        ellipse(ctx,pt(0,0),9.5,12.2,skin);ctx.restore();
    }
    function dumbbell(ctx,h,angle=0){ctx.save();ctx.translate(h.x,h.y);ctx.rotate(angle);line(ctx,pt(-8,0),pt(8,0),'#7F8998',3);box(ctx,-12,-7,6,14,'#303947',1.6);box(ctx,6,-7,6,14,'#303947',1.6);line(ctx,pt(-9,-5),pt(-9,5),'#566274',1);ctx.restore();}
    function kettlebell(ctx,h){ctx.beginPath();ctx.ellipse(h.x,h.y+2,5,5,0,0,TAU);ctx.strokeStyle='#313D4B';ctx.lineWidth=2.6;ctx.stroke();ellipse(ctx,pt(h.x,h.y+11),9,9,'#364352');ellipse(ctx,pt(h.x-3,h.y+8),2,3,'#657387');}
    function barbell(ctx,a,b){const mid=lerp(a,b,.5),span=Math.max(32,Math.abs(a.x-b.x)/2+16);line(ctx,pt(mid.x-span-5,mid.y),pt(mid.x+span+5,mid.y),'#85909E',3);for(const sign of [-1,1]){box(ctx,mid.x+sign*span-3,mid.y-12,6,24,'#27313E',1.7);box(ctx,mid.x+sign*(span+5)-2,mid.y-8,4,16,'#475465',1);}}
    function bench(ctx,x,y,w){box(ctx,x,y,w,7,'#3C4654');line(ctx,pt(x+9,y+7),pt(x+5,184),'#9DA6B2',3);line(ctx,pt(x+w-9,y+7),pt(x+w-5,184),'#9DA6B2',3);}
    function scene(ctx,p,phase){
        const c='#BFC7D0';
        switch(p.scene){
        case 'mat':box(ctx,29,184,184,3,'#E2E7EB',1.5);break;
        case 'chair':bench(ctx,69,158,40);line(ctx,pt(70,158),pt(70,113),c,4);break;
        case 'presschair':bench(ctx,96,154,47);line(ctx,pt(100,154),pt(100,105),c,4);break;
        case 'support':bench(ctx,149,148,35);line(ctx,pt(154,149),pt(154,107),c,4);line(ctx,pt(151,107),pt(176,107),c,4);break;
        case 'legchair':bench(ctx,50,150,36);line(ctx,pt(81,151),pt(81,107),c,4);break;
        case 'wall':box(ctx,81,49,7,136,'#E4E8ED');line(ctx,pt(89,49),pt(89,184),c,2);break;
        case 'pushwall':box(ctx,205,45,8,140,'#E4E8ED');break;
        case 'handwall':box(ctx,162,20,6,164,'#E4E8ED');break;
        case 'angelwall':box(ctx,78,42,84,143,'#F0F2F5',0);break;
        case 'step':box(ctx,125,152,48,32,'#D9E0E7');box(ctx,124,151,50,4,'#8C98A7');break;
        case 'box':box(ctx,143,156,43,28,'#D9E0E7');box(ctx,142,155,45,3,'#8C98A7');break;
        case 'splitbench':bench(ctx,61,150,36);break;
        case 'incline':bench(ctx,135,148,41);break;
        case 'blocks':bench(ctx,152,174,23);break;
        case 'bench':bench(ctx,52,155,91);break;
        case 'hipbench':bench(ctx,57,146,33);break;
        case 'dipbench':bench(ctx,82,131,40);break;
        case 'parallettes':bench(ctx,95,157,27);break;
        case 'pullbar':case 'lowbar':case 'rowbar':{
            const y=p.scene==='rowbar'?95:65;line(ctx,pt(53,y),pt(53,184),c,3);line(ctx,pt(187,y),pt(187,184),c,3);line(ctx,pt(52,y),pt(188,y),'#536171',4);break;
        }
        case 'bandfront':line(ctx,pt(192,65),pt(192,184),c,3);break;
        case 'bandback':line(ctx,pt(67,65),pt(67,184),c,3);break;
        case 'bike':{
            for(const x of [77,177]){ellipse(ctx,pt(x,160),23,23,'#EDF0F3');ctx.beginPath();ctx.arc(x,160,23,0,TAU);ctx.strokeStyle='#6E7B8B';ctx.lineWidth=3;ctx.stroke();}
            for(const [a,b]of [[pt(77,160),pt(110,132)],[pt(110,132),pt(132,157)],[pt(132,157),pt(77,160)],[pt(110,132),pt(162,130)],[pt(162,130),pt(132,157)],[pt(177,160),pt(156,107)]])line(ctx,a,b,'#8C9AAA',3);
            line(ctx,pt(103,130),pt(119,130),'#354252',5);line(ctx,pt(156,107),pt(168,105),'#354252',4);
            line(ctx,pt(132+15*Math.cos(TAU*phase),157+15*Math.sin(TAU*phase)),pt(132-15*Math.cos(TAU*phase),157-15*Math.sin(TAU*phase)),'#5A6675',2);break;
        }
        }
    }
    function equipment(ctx,p,j,spec,phase){
        const n=norm(spec.name),hands=j.arms.map(a=>a.end);
        if(n.includes('barbell')||/bar$/.test(spec.load||'')){
            if(n.includes('thrust'))barbell(ctx,add(j.hip,pt(-15,-5)),add(j.hip,pt(15,-5)));
            else barbell(ctx,hands[0],hands[1]);
        }else if(spec.load==='goblet')kettlebell(ctx,lerp(hands[0],hands[1],.5));
        else if(n.includes('kettlebell')||spec.type==='getup'){
            if(spec.type==='swing'||spec.type==='deadlift')kettlebell(ctx,lerp(hands[0],hands[1],.5));else kettlebell(ctx,hands[1]);
        }else if(/dumbbell|weighted|hammer|skull|front raise|lateral raise|triceps extension|farmers|renegade|superman row/.test(n)){
            if(n.includes('weighted pull')||n.includes('weighted dip'))dumbbell(ctx,add(j.hip,pt(0,13)));
            else if(n.includes('wall sit'))dumbbell(ctx,add(j.hip,pt(19,2)));
            else if(n.includes('twist')||n.includes('triceps'))dumbbell(ctx,lerp(hands[0],hands[1],.5));
            else hands.forEach(h=>dumbbell(ctx,h,n.includes('hammer')?PI/2:0));
        }
        if(spec.type==='pullapart')line(ctx,hands[0],hands[1],'#6E82A2',2.5);
        if(spec.type==='band_row'||spec.type==='band_press')hands.forEach(h=>line(ctx,pt(spec.type==='band_press'?67:192,n.includes('face')?74:92),h,'#6E82A2',1.8));
        if(spec.load==='squatband')hands.forEach((h,i)=>line(ctx,j.legs[i].end,h,'#6E82A2',1.8));
        if(spec.type==='band_walk'){const a=lerp(j.legs[0].root,j.legs[0].mid,.75),b=lerp(j.legs[1].root,j.legs[1].mid,.75);line(ctx,a,b,'#6E82A2',5);}
        if(spec.type==='rope'){
            ctx.beginPath();ctx.moveTo(hands[0].x,hands[0].y);const y=110+80*Math.cos(TAU*phase);ctx.bezierCurveTo(45,y,195,y,hands[1].x,hands[1].y);ctx.strokeStyle='#64748B';ctx.lineWidth=1.8;ctx.stroke();
        }
        if(spec.type==='battle')hands.forEach((h,i)=>{ctx.beginPath();ctx.moveTo(h.x,h.y);for(let x=h.x;x<225;x+=3)ctx.lineTo(x,mix(h.y,181,(x-h.x)/(225-h.x))+Math.sin(x*.14-phase*TAU+i)*7*(x-h.x)/(225-h.x));ctx.strokeStyle=i?'#738297':'#A4AFBC';ctx.lineWidth=3;ctx.stroke();});
    }

    const HollowMan={
        canvases:[],animFrameId:null,isPlaying:true,speed:1,currentTime:0,lastFrameTime:0,cycleDuration:4,
        getDefinition(name){return catalog.get(norm(name))||{name:name||'Exercise',type:'unavailable',duration:4,cue:'No matching form demonstration is available.',hold:true};},
        getArchetype(name){return this.getDefinition(name).type;},
        getPose(name,phase=0){const spec=this.getDefinition(name);return poseFor(spec,spec.hold?0:phase);},
        getRig(name,phase=0){return rig(this.getPose(name,phase));},
        init(){
            const els=document.querySelectorAll('.hollowman-canvas, #session-hollowman-canvas');
            this.canvases=this.canvases.filter(item=>item.canvas.isConnected&&Array.from(els).includes(item.canvas));
            els.forEach(c=>this.registerCanvas(c,c.getAttribute('data-exercise')||'Bodyweight Squat'));
            if(!this._initialized){
                this._initialized=true;
                const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
                if(reduced?.matches)this.isPlaying=false;
                reduced?.addEventListener?.('change',e=>{if(e.matches)this.pause();});
                document.addEventListener('visibilitychange',()=>{this.lastFrameTime=0;if(document.hidden){cancelAnimationFrame(this.animFrameId);this.animFrameId=null;}else{this.renderAll();this.schedule();}});
                window.addEventListener('resize',()=>this.renderAll(),{passive:true});
                window.addEventListener('scroll',()=>{if(!this.isPlaying)this.renderAll();},{passive:true,capture:true});
            }
            this.updatePlayStateUI();this.updateSpeedUI();this.renderAll();this.schedule();
        },
        registerCanvas(canvas,exerciseName){
            const existing=this.canvases.find(c=>c.canvas===canvas);
            if(existing){existing.exercise=exerciseName;return;}
            const ctx=canvas.getContext('2d');if(!ctx)return;
            canvas.setAttribute('role','img');canvas.setAttribute('aria-label',exerciseName+'. '+this.getDefinition(exerciseName).cue);
            this.canvases.push({canvas,ctx,exercise:exerciseName,visible:true});
        },
        updateSessionExercise(canvasId,exerciseName){
            const c=document.getElementById(canvasId);if(!c)return;
            c.setAttribute('data-exercise',exerciseName);c.setAttribute('aria-label',exerciseName+'. '+this.getDefinition(exerciseName).cue);
            this.registerCanvas(c,exerciseName);this.currentTime=0;this.lastFrameTime=0;this.renderAll();this.schedule();
        },
        play(){this.isPlaying=true;this.lastFrameTime=0;this.updatePlayStateUI();this.schedule();},
        pause(){this.isPlaying=false;cancelAnimationFrame(this.animFrameId);this.animFrameId=null;this.updatePlayStateUI();},
        togglePlay(){this.isPlaying?this.pause():this.play();},
        restart(){this.currentTime=0;this.lastFrameTime=0;this.renderAll();},
        setSpeed(value){const speed=Number(value);if(!Number.isFinite(speed)||speed<=0)return;this.speed=clamp(speed,.25,2);this.updateSpeedUI();},
        updatePlayStateUI(){
            const icon=document.getElementById('anim-play-icon'),button=document.getElementById('anim-play-pause-btn');
            if(icon)icon.className=this.isPlaying?'fas fa-pause text-gray-700':'fas fa-play text-gray-700';
            if(button){button.setAttribute('aria-label',this.isPlaying?'Pause demonstration':'Play demonstration');button.setAttribute('aria-pressed',String(this.isPlaying));}
        },
        updateSpeedUI(){document.querySelectorAll('.anim-speed-pill').forEach(pill=>{
            const selected=Math.abs(Number(pill.getAttribute('data-speed'))-this.speed)<.01;
            pill.className='anim-speed-pill px-2 py-0.5 text-[11px] font-black rounded-lg '+(selected?'bg-gray-900 text-white shadow-xs':'text-gray-500 hover:text-gray-900 transition-colors');pill.setAttribute('aria-pressed',String(selected));
        });},
        schedule(){if(!this.animFrameId&&!document.hidden&&this.isPlaying)this.animFrameId=requestAnimationFrame(time=>this.loop(time));},
        loop(time){
            this.animFrameId=null;const dt=this.lastFrameTime?Math.min((time-this.lastFrameTime)/1000,.05):0;this.lastFrameTime=time;
            if(this.isPlaying)this.currentTime+=dt*this.speed;
            this.renderAll();this.schedule();
        },
        renderAll(){
            this.canvases=this.canvases.filter(item=>item.canvas.isConnected);
            for(const item of this.canvases){
                const rect=item.canvas.getBoundingClientRect();
                if(!rect.width||!rect.height||rect.bottom<0||rect.top>window.innerHeight||rect.right<0||rect.left>window.innerWidth)continue;
                const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
                if(item.canvas.width!==w||item.canvas.height!==h){item.canvas.width=w;item.canvas.height=h;}
                const spec=this.getDefinition(item.exercise),phase=spec.hold?0:(this.currentTime%spec.duration)/spec.duration;
                this.render(item.ctx,w,h,item.exercise,phase,rect.width>=200);
            }
        },
        render(ctx,w,h,name,phase=0,details=w>=300){
            if(!ctx||!w||!h)return;
            const spec=this.getDefinition(name),p=poseFor(spec,spec.hold?0:phase),j=rig(p);
            ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,w,h);
            // Uniform fitting: canvas CSS proportions may differ from its attributes.
            const floorView=['pushup','diamond','one_arm','deficit','plyo','archer','knee_pushup','incline_pushup','plank','taps','renegade','bird_dog','dead_bug','bridge','superman','flutter','hollow','climbers','catcow','child','bench_press','fly','skull'].includes(spec.type);
            const top=floorView?80:0,viewHeight=(details?220:202)-top;
            const scale=Math.min(w/240,h/viewHeight);ctx.translate((w-240*scale)/2,(h-viewHeight*scale)/2-top*scale);ctx.scale(scale,scale);
            line(ctx,pt(30,187),pt(214,187),'#E7EBF0',1);ellipse(ctx,pt(122,187),p.scene==='mat'?77:37,3,'rgba(51,65,85,.07)');
            scene(ctx,p,phase);drawLeg(ctx,j.legs[0],p,0);drawArm(ctx,j.arms[0],0);drawLeg(ctx,j.legs[1],p,1);drawBody(ctx,p,j);drawArm(ctx,j.arms[1],1);equipment(ctx,p,j,spec,phase);
            if(details){
                ctx.textAlign='center';ctx.font='600 9px system-ui, sans-serif';ctx.fillStyle='#263342';ctx.fillText(p.phase,120,203,228);
                ctx.font='8px system-ui, sans-serif';ctx.fillStyle='#657184';ctx.fillText(spec.cue,120,216,232);
            }
            if(spec.type==='unavailable'&&!details){ctx.textAlign='center';ctx.font='9px system-ui, sans-serif';ctx.fillStyle='#657184';ctx.fillText('Demo unavailable',120,200);}
            ctx.restore();
        }
    };
    window.HollowMan=HollowMan;
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>HollowMan.init());else HollowMan.init();
})();
