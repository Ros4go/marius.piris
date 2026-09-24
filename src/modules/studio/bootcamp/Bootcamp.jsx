import { useRoute, segments, navigate } from '../../../core/router.js'
import { categoryById } from './categories.js'
import Hub from './Hub.jsx'
import Category from './Category.jsx'
import './bootcamp.css'

// Point d'entrée du module (lazy-loadé par Studio.jsx) :
//   #/studio/bootcamp        -> hub (liste des catégories)
//   #/studio/bootcamp/<id>   -> une catégorie (chapitres, cartes, quiz)
export default function Bootcamp() {
  const seg = segments(useRoute()) // ['studio', 'bootcamp', id?]
  const id = seg[2]
  if (!id) return <Hub />

  const category = categoryById(id)
  if (!category) {
    return (
      <div className="bootcamp">
        <div className="bc-inner">
          <div className="bc-deck-end">
            <div className="bc-deck-end-emoji">🧭</div>
            <h3>Catégorie inconnue</h3>
            <p>« {id} » n'existe pas (ou pas encore).</p>
            <div className="bc-deck-end-btns">
              <button className="btn" onClick={() => navigate('/studio/bootcamp')}><span>◄ Voir les catégories</span></button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  // key : changer de catégorie remonte un composant neuf (état de vue remis à zéro)
  return <Category key={category.id} category={category} />
}
