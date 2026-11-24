import Link from "next/link";
import { services } from "@/content/site";
import { localizeTree, type Locale } from "@/lib/i18n";
import styles from "./workforce-services.module.css";

export default function WorkforceServices({ locale }: { locale: Locale }) {
  return localizeTree(
    <div className={styles.serviceWorkbench}>
      <fieldset className={styles.serviceChoices}>
        <legend className={styles.visuallyHidden}>Choose a workforce service</legend>
        {services.map(({ slug, label }, index) => (
          <label key={slug}>
            <input type="radio" name="workforce-service" value={slug} defaultChecked={index === 0} aria-controls={`service-panel-${slug}`} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <div>
        {services.map((service) => (
          <article key={service.slug} id={`service-panel-${service.slug}`} className={styles.servicePanel}>
            <div>
              <h3>{service.headline}</h3>
              <p>{service.intro}</p>
              <Link className="text-link" href={`/solutions/${service.slug}`}>Explore service</Link>
            </div>
            <div className={styles.checklist}>
              <p>{service.label}</p>
              <ul>
                {service.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>,
    locale,
  );
}
