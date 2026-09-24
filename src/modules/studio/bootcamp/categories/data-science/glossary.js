import { makeGlossaryMatcher } from '../../glossary.js'

// Glossaire de la catégorie Data science, en langage simple (débutant).
// Une définition ne s'affiche QUE si son terme apparaît (mot entier) dans la
// question ou les choix d'un quiz. Volontairement resserré aux termes qui comptent.
export const GLOSSARY = [
  // --- Données ---
  { term: 'Donnée', aliases: ['donnée', 'données', 'data'], def: "Une information stockée à propos d'un phénomène : une température relevée, un prix de vente, les clics d'un joueur. Sans stockage, ce n'est pas une donnée." },
  { term: 'Dataset', aliases: ['dataset', 'jeu de données'], def: "L'ensemble des exemples dont on dispose pour entraîner et tester un modèle. En supervisé : une matrice X (les entrées) et un vecteur y (les réponses attendues)." },
  { term: 'Feature', aliases: ['feature', 'features', 'variable d’entrée', 'variables d’entrée'], def: "Une variable d'entrée qu'on donne au modèle : la surface d'une maison, son nombre de pièces, la présence d'un jardin. Une colonne de X." },
  { term: 'Label', aliases: ['label', 'labels', 'étiquette', 'étiquettes'], def: "La bonne réponse associée à un exemple, celle que le modèle doit apprendre à retrouver : le prix réel de la maison, « hamster » ou « octodon ». Le vecteur y." },
  // --- ML ---
  { term: 'Modèle', aliases: ['modèle', 'modèles', 'model'], def: "Une fonction mathématique à boutons (les paramètres) qui transforme une entrée x en prédiction. Avant entraînement c'est une famille de fonctions possibles ; après, une seule, les boutons étant réglés." },
  { term: 'Paramètres (poids)', aliases: ['paramètre', 'paramètres', 'poids', 'weights', 'weight'], def: "Les nombres réglables du modèle, notés w ou θ. Entraîner un modèle, c'est trouver les bonnes valeurs de ces nombres. Une régression linéaire à 3 features a 4 poids : w0, w1, w2, w3." },
  { term: 'Loss (fonction d’erreur)', aliases: ['loss', 'fonction d’erreur', "fonction d'erreur", 'fonction de coût'], def: "Un nombre qui mesure à quel point les prédictions sont loin des valeurs attendues. Petit = bon modèle. L'entraînement cherche les poids qui rendent ce nombre le plus petit possible." },
  { term: 'MSE', aliases: ['mse', 'mean squared error', 'erreur quadratique moyenne'], def: "Mean Squared Error : pour chaque exemple on prend (prédiction − attendu)², puis on fait la moyenne. C'est la loss standard de la régression." },
  { term: 'Prédiction (ŷ)', aliases: ['prédiction', 'prédictions', 'ŷ', 'y_pred'], def: "La sortie du modèle pour une entrée donnée, notée ŷ (« y chapeau »). On la compare à y, la vraie valeur, pour mesurer l'erreur." },
  { term: 'Supervisé', aliases: ['supervisé', 'supervisée', 'supervised'], def: "Apprentissage où chaque exemple vient avec sa bonne réponse (le label y). Le modèle apprend à reproduire la relation entrée → réponse. Régression et classification sont supervisées." },
  { term: 'Non supervisé', aliases: ['non supervisé', 'non supervisée', 'unsupervised'], def: "Apprentissage sans labels : on n'a que les entrées X. Le modèle cherche une structure tout seul, par exemple des groupes (clusters) de points qui se ressemblent." },
  { term: 'Régression', aliases: ['régression', 'regression'], def: "Prédire une valeur numérique continue : un prix, une durée, une température. À ne pas confondre avec la classification, qui prédit une catégorie." },
  { term: 'Classification', aliases: ['classification', 'classifier', 'classer'], def: "Prédire une catégorie parmi un nombre fini de choix : malade ou pas, hamster ou octodon, va acheter ou non." },
  { term: 'Overfitting', aliases: ['overfitting', 'sur-apprentissage', 'surapprentissage', 'par cœur'], def: "Apprentissage par cœur : le modèle est excellent sur les données d'entraînement mais mauvais sur des données nouvelles. On le détecte grâce au jeu de test." },
  { term: 'Jeu de test', aliases: ['jeu de test', 'test set', 'données de test'], def: "Une partie des données mise de côté, jamais utilisée pour l'entraînement, qui sert à mesurer si le modèle marche sur des exemples qu'il n'a jamais vus." },
  { term: 'Sigmoïde', aliases: ['sigmoïde', 'sigmoid'], def: "La fonction 1 / (1 + exp(−x)). Elle écrase n'importe quel nombre entre 0 et 1, ce qui permet de lire la sortie comme une probabilité. Cœur de la régression logistique." },
  // --- Maths ---
  { term: 'Dérivée', aliases: ['dérivée', 'dérivées', 'dériver'], def: "La pente d'une fonction en un point : de combien f(x) change quand x augmente d'un tout petit peu. Positive = ça monte, négative = ça descend, nulle = plat (souvent un minimum ou un maximum)." },
  { term: 'Dérivée partielle', aliases: ['dérivée partielle', 'dérivées partielles', '∂'], def: "Pour une fonction à plusieurs variables : la dérivée par rapport à UNE variable, en faisant comme si les autres étaient des constantes. Notée ∂f/∂x." },
  { term: 'Gradient', aliases: ['gradient', 'gradients', '∇'], def: "Le vecteur qui rassemble toutes les dérivées partielles d'une fonction. Il pointe dans la direction où la fonction monte le plus vite ; on va dans le sens opposé pour descendre." },
  { term: 'Descente de gradient', aliases: ['descente de gradient', 'gradient descent'], def: "L'algorithme qui minimise une fonction pas à pas : à chaque itération, x ← x − α · f′(x). On avance dans le sens opposé à la pente, avec un pas réglé par α." },
  { term: 'Learning rate (α)', aliases: ['learning rate', 'alpha', 'α', 'taux d’apprentissage', 'pas'], def: "Le coefficient α qui règle la taille de chaque pas de la descente de gradient. Trop petit : on avance lentement. Trop grand : on saute par-dessus le minimum et ça peut diverger." },
  { term: 'Itération', aliases: ['itération', 'itérations', 'iteration'], def: "Un tour de boucle de l'algorithme : calculer le gradient, mettre à jour les poids, recommencer. L'entraînement en enchaîne des centaines ou des milliers." },
  { term: 'Convergence', aliases: ['convergence', 'converger', 'converge'], def: "Quand les itérations se rapprochent de plus en plus d'une valeur stable, sans plus bouger : l'algorithme a trouvé (ou approché) le minimum." },
  { term: 'Produit scalaire', aliases: ['produit scalaire', 'dot product'], def: "Somme des produits terme à terme de deux vecteurs : w·x = w0·x0 + w1·x1 + … Avec x0 = 1, c'est exactement la formule de la régression linéaire." },
  { term: 'Vecteur', aliases: ['vecteur', 'vecteurs', 'vector'], def: "Une liste ordonnée de nombres, par exemple les poids (w0, w1, w2) ou les features d'un exemple. Une matrice est un tableau de vecteurs empilés." },
]

export const matchGlossary = makeGlossaryMatcher(GLOSSARY)
