import { makeGlossaryMatcher } from '../../glossary.js'

// Glossaire de la catégorie CUDA, en langage simple (débutant).
// Une définition ne s'affiche QUE si son terme apparaît (mot entier) dans la
// question ou les choix d'un quiz.
export const GLOSSARY = [
  // --- matériel ---
  { term: 'Host', aliases: ['host', 'hôte'], def: "Le CPU et sa mémoire (la RAM du PC). C'est lui qui exécute main, réserve la mémoire du GPU, copie les données et lance les kernels." },
  { term: 'Device', aliases: ['device'], def: "Le GPU et sa propre mémoire. Il exécute les kernels. Sa mémoire est séparée de celle du host : il faut y copier les données avec cudaMemcpy." },
  { term: 'SM (Streaming Multiprocessor)', aliases: ['sm', 'multiprocesseur', 'multiprocesseurs', 'streaming multiprocessor'], def: "Un multiprocesseur du GPU : un groupe de cœurs CUDA avec ses registres et sa shared memory. Un bloc s'exécute entièrement sur un SM. Nombre de SM : prop.multiProcessorCount." },
  { term: 'Cœur CUDA', aliases: ['cœurs cuda', 'cœur cuda', 'cuda core', 'cuda cores', 'cœurs'], def: "Une unité de calcul du GPU. Nombre total = nombre de SM × cœurs par SM, ce dernier dépendant de la compute capability (128 pour Pascal 6.1, 64 pour Turing…)." },
  { term: 'Compute capability', aliases: ['compute capability', 'cc', 'cuda compute'], def: "La version x.y d'un GPU NVIDIA (prop.major, prop.minor) : x la génération, y la révision. Elle fixe les limites et le nombre de cœurs par SM. Ex. 6.1 Pascal, 8.6 Ampere, 8.9 Ada." },
  { term: 'Warp', aliases: ['warp', 'warps', 'warpsize'], def: "Un paquet de 32 threads exécutés ensemble : ils font la même instruction au même moment. D'où les tailles de bloc multiples de 32." },
  { term: 'PCI Express', aliases: ['pci express', 'pci', 'bus pci'], def: "Le bus qui relie la carte graphique à la carte mère. Toutes les copies host ↔ device passent par lui : c'est souvent le goulot d'étranglement." },
  { term: 'Jetson', aliases: ['jetson'], def: "Modules embarqués NVIDIA (Nano, Orin…) où CPU ARM et GPU sont sur la même puce et partagent la même mémoire : peu de consommation, pour la robotique ou la vision embarquée." },
  // --- compilation ---
  { term: 'nvcc', aliases: ['nvcc'], def: "Le compilateur CUDA. Il sépare le code GPU (compilé en PTX puis en code machine) du code CPU (confié à cl.exe ou gcc). Usage : nvcc prog.cu -o prog." },
  { term: 'PTX', aliases: ['ptx'], def: "Parallel Thread eXecution : l'assembleur virtuel de CUDA, indépendant du modèle de GPU. Le driver peut le recompiler pour une carte plus récente." },
  { term: 'SASS', aliases: ['sass', 'cubin'], def: "Le vrai code machine d'une architecture de GPU (sm_52, sm_80…), rangé dans un cubin. Visible avec cuobjdump -sass." },
  // --- programmation ---
  { term: 'Kernel', aliases: ['kernel', 'kernels', 'noyau'], def: "Une fonction exécutée sur le GPU par de nombreux threads en parallèle. Déclarée __global__, elle renvoie void et se lance avec kernel<<<blocs, threads>>>(…)." },
  { term: '__global__', aliases: ['__global__'], def: "Qualificatif d'un kernel : fonction exécutée sur le GPU, appelée depuis le CPU, qui renvoie void." },
  { term: '__device__', aliases: ['__device__'], def: "Qualificatif d'une fonction GPU appelée depuis le GPU (par un kernel). Elle peut renvoyer une valeur, comme julia() ou les méthodes de cuComplex." },
  { term: '<<< >>>', aliases: ['<<<', 'chevrons', 'configuration de lancement'], def: "La configuration de lancement d'un kernel : <<<nombre de blocs, threads par bloc>>>, et en option un 3e paramètre, les octets de shared memory dynamique." },
  { term: 'Bloc', aliases: ['bloc', 'blocs', 'block'], def: "Un groupe de threads (au plus 1024) exécuté sur un même SM. Ses threads partagent la shared memory et peuvent se synchroniser avec __syncthreads()." },
  { term: 'Grille', aliases: ['grille', 'grid'], def: "L'ensemble des blocs lancés pour un kernel. Jusqu'à 2³¹ − 1 blocs en x, 65 535 en y et z." },
  { term: 'threadIdx', aliases: ['threadidx', 'threadidx.x', 'threadidx.y'], def: "Le numéro du thread dans son bloc (.x, .y, .z), de 0 à blockDim − 1." },
  { term: 'blockIdx', aliases: ['blockidx', 'blockidx.x', 'blockidx.y'], def: "Le numéro du bloc dans la grille (.x, .y, .z), de 0 à gridDim − 1." },
  { term: 'blockDim', aliases: ['blockdim', 'blockdim.x'], def: "La taille d'un bloc : le nombre de threads par bloc (2e paramètre des chevrons)." },
  { term: 'gridDim', aliases: ['griddim', 'griddim.x'], def: "La taille de la grille : le nombre de blocs (1er paramètre des chevrons)." },
  { term: 'Indice global', aliases: ['indice global', 'indice unique', 'index'], def: "Le numéro unique d'un thread dans toute la grille, en 1D : threadIdx.x + blockIdx.x * blockDim.x." },
  { term: 'dim3', aliases: ['dim3'], def: "Type à 3 composantes (x, y, z) pour décrire une grille ou un bloc en 2D / 3D : dim3 threads(16, 16). Les composantes non précisées valent 1." },
  { term: 'Boucle à pas de grille', aliases: ['pas de grille', 'grid-stride'], def: "Une boucle dans le kernel : départ à l'indice global, pas de blockDim.x * gridDim.x. Elle traite un tableau de n'importe quelle taille avec une grille fixe." },
  // --- mémoire ---
  { term: 'cudaMalloc', aliases: ['cudamalloc'], def: "Réserve de la mémoire sur le GPU : cudaMalloc((void**)&dev_p, taille_en_octets). Le pointeur obtenu n'est pas utilisable directement par le CPU." },
  { term: 'cudaMemcpy', aliases: ['cudamemcpy'], def: "Copie entre mémoires : cudaMemcpy(destination, source, octets, sens), avec cudaMemcpyHostToDevice ou cudaMemcpyDeviceToHost. Elle attend la fin des kernels précédents." },
  { term: 'cudaFree', aliases: ['cudafree'], def: "Libère la mémoire réservée sur le GPU par cudaMalloc." },
  { term: 'cudaMemset', aliases: ['cudamemset'], def: "Remplit une zone de mémoire GPU octet par octet, typiquement à 0 (un histogramme avant les atomicAdd)." },
  { term: 'Mémoire globale', aliases: ['mémoire globale', 'global memory'], def: "La mémoire principale du GPU (plusieurs Go), allouée par cudaMalloc, visible par tous les threads. La plus grande et la plus lente." },
  { term: 'Shared memory', aliases: ['shared memory', 'shared', '__shared__', 'mémoire partagée'], def: "Mémoire rapide située dans le SM, partagée par les threads d'un même bloc (environ 48 Ko par bloc). Déclarée __shared__, elle vit le temps du bloc." },
  { term: 'Mémoire constante', aliases: ['mémoire constante', '__constant__', 'constant memory'], def: "64 Ko en lecture seule pour les kernels, avec cache. Idéale quand tous les threads lisent la même valeur (coefficients d'un masque). Remplie avec cudaMemcpyToSymbol." },
  { term: 'Registres', aliases: ['registre', 'registres'], def: "La mémoire privée et la plus rapide de chaque thread : ses variables locales. 65 536 registres partagés par les threads d'un bloc." },
  { term: 'Accès coalescé', aliases: ['coalescé', 'coalescés', 'coalescence'], def: "Quand les threads consécutifs d'un warp lisent des adresses consécutives, le GPU regroupe leurs lectures en une seule transaction. Sinon, jusqu'à 32 lectures séparées." },
  // --- synchronisation ---
  { term: '__syncthreads()', aliases: ['__syncthreads', 'syncthreads', 'barrière'], def: "Barrière : chaque thread du bloc attend que tous les autres l'aient atteinte. Ne synchronise que le bloc, et doit être atteinte par tous ses threads (jamais dans un if divergent)." },
  { term: 'atomicAdd', aliases: ['atomicadd', 'atomique', 'atomiques'], def: "Addition indivisible : lire, ajouter, écrire sans qu'un autre thread puisse s'intercaler. Indispensable quand plusieurs threads incrémentent la même case (histogramme)." },
  { term: 'Course de données', aliases: ['course de données', 'race condition', 'concurrence'], def: "Bug où plusieurs threads lisent et écrivent la même donnée sans coordination : des mises à jour se perdent et le résultat change à chaque exécution." },
  { term: 'Divergence', aliases: ['divergence de branche', 'branche divergente', 'if divergent'], def: "Quand les threads d'un même warp prennent des branches différentes d'un if : le warp exécute les deux branches l'une après l'autre." },
  { term: 'Réduction', aliases: ['réduction'], def: "Combiner beaucoup de valeurs en une seule (somme, max…). Sur GPU, on additionne par paires en arbre : log₂(n) étapes au lieu de n − 1 additions en séquence." },
  { term: 'Asynchrone', aliases: ['asynchrone', 'cudadevicesynchronize'], def: "Un lancement de kernel rend la main au CPU tout de suite, sans attendre la fin du calcul. cudaMemcpy ou cudaDeviceSynchronize() attendent." },
  // --- mesures et erreurs ---
  { term: 'cudaEvent', aliases: ['cudaevent_t', 'cudaeventrecord', 'cudaeventelapsedtime', 'événements', 'événement'], def: "Repère horodaté par le GPU. cudaEventRecord(start), le kernel, cudaEventRecord(stop), cudaEventSynchronize(stop), puis cudaEventElapsedTime(&ms, start, stop) donne la durée en ms." },
  { term: 'cudaError_t', aliases: ['cudaerror_t', 'cudasuccess', 'cudageterrorstring', 'cudagetlasterror'], def: "Le code d'erreur renvoyé par les fonctions CUDA (cudaSuccess si tout va bien). cudaGetErrorString le traduit en texte ; cudaGetLastError récupère l'erreur d'un lancement de kernel." },
  { term: 'Accélération', aliases: ['accélération', 'speedup'], def: "Temps CPU divisé par temps GPU. Préciser toujours si le temps GPU inclut les copies host ↔ device." },
  // --- flottants ---
  { term: 'IEEE 754', aliases: ['ieee 754', 'ieee'], def: "La norme des nombres flottants : float sur 32 bits (1 signe, 8 exposant, 23 mantisse), double sur 64 bits (1, 11, 52)." },
  { term: 'NaN', aliases: ['nan'], def: "Not a Number : le résultat de 0/0, de sqrt ou log d'un négatif. Il contamine tous les calculs où il apparaît, et NaN == NaN est faux." },
  { term: 'FP32 / FP64', aliases: ['fp32', 'fp64', 'simple précision', 'double précision'], def: "Calcul en float (32 bits) ou en double (64 bits). Sur les GeForce, le FP64 est des dizaines de fois plus lent que le FP32." },
  { term: 'FLOPS', aliases: ['flops', 'gflops', 'tflops'], def: "Opérations flottantes par seconde. Toujours préciser FP32 ou FP64." },
  // --- images ---
  { term: 'Histogramme', aliases: ['histogramme', 'histogrammes'], def: "Pour chaque valeur de pixel (0 à 255), le nombre de pixels qui ont cette valeur." },
  { term: 'Sobel', aliases: ['sobel', 'prewitt', 'roberts'], def: "Masques de convolution 3 × 3 qui calculent le gradient d'une image pour en détecter les contours. Horizontal : [−1 0 1 ; −2 0 2 ; −1 0 1]." },
  { term: 'Gradient', aliases: ['gradient', 'gradients'], def: "La variation d'intensité entre pixels voisins, selon x et selon y. Il est grand sur un contour. Module : √(Gx² + Gy²)." },
  // --- performance et écosystème ---
  { term: "Loi d'Amdahl", aliases: ['amdahl', "loi d'amdahl"], def: "L'accélération d'un programme est plafonnée par sa partie qui reste séquentielle : parallélisable à 90 %, il ne peut pas aller plus de 10 fois plus vite." },
  { term: 'SIMT', aliases: ['simt'], def: "Single Instruction, Multiple Threads : le modèle des GPU NVIDIA. On écrit le code d'un thread, et le matériel exécute les threads par warps de 32 qui suivent la même instruction." },
  { term: 'Occupation', aliases: ['occupation', 'occupancy'], def: "Nombre de warps actifs sur un SM par rapport au maximum possible. Limitée par les registres, la shared memory et le nombre de blocs ; elle aide à masquer la lenteur de la mémoire." },
  { term: 'Stream', aliases: ['stream', 'streams'], def: "File de commandes (copies, kernels) exécutées dans l'ordre. Deux streams différents peuvent travailler en même temps, ce qui permet de recouvrir copies et calcul." },
  { term: 'Mémoire unifiée', aliases: ['mémoire unifiée', 'cudamallocmanaged'], def: "Mémoire allouée avec cudaMallocManaged : un seul pointeur pour le CPU et le GPU, les données migrant automatiquement. Les transferts ont toujours lieu, en coulisses." },
  { term: 'Mémoire épinglée', aliases: ['mémoire épinglée', 'pinned', 'cudamallochost'], def: "Mémoire du CPU verrouillée en RAM (cudaMallocHost), que le GPU lit directement : transferts plus rapides, et possibles en asynchrone pendant un calcul." },
  { term: 'Intensité arithmétique', aliases: ['intensité arithmétique', 'roofline'], def: "Nombre d'opérations par octet lu ou écrit en mémoire. Faible : le kernel est limité par la bande passante mémoire ; forte : par la puissance de calcul." },
  { term: 'Tensor core', aliases: ['tensor core', 'tensor cores'], def: "Unité spécialisée dans les produits de petites matrices en précision réduite (FP16, BF16, INT8…), apparue avec Volta. Elle accélère surtout l'IA, via cuBLAS ou cuDNN." },
  { term: 'OpenCL', aliases: ['opencl'], def: "Standard ouvert de calcul parallèle (Khronos), qui tourne sur des GPU et CPU de nombreux fabricants. Même modèle que CUDA, mais plus verbeux et moins outillé." },
  { term: 'HIP', aliases: ['hip', 'rocm'], def: "La plateforme de calcul d'AMD (ROCm), dont l'API reprend presque mot pour mot celle de CUDA : un code CUDA se convertit en HIP quasi automatiquement." },
  { term: 'Compute shader', aliases: ['compute shader', 'compute shaders'], def: "Programme de calcul exécuté sur le GPU via une API graphique (DirectX, Vulkan, OpenGL, Metal). C'est le calcul GPU des moteurs de jeu, car il marche sur toutes les cartes." },
  { term: 'cuBLAS', aliases: ['cublas'], def: "Bibliothèque NVIDIA d'algèbre linéaire sur GPU (produits de matrices…), optimisée pour chaque génération et pour les Tensor cores." },
  { term: 'Thrust', aliases: ['thrust'], def: "Bibliothèque C++ façon STL qui trie, réduit ou transforme des tableaux sur le GPU sans écrire de kernel." },
]

export const matchGlossary = makeGlossaryMatcher(GLOSSARY)
