import { formatPrice } from "@/lib/utils";
import type { RepairServiceShape } from "@/lib/repair-catalog";

export default function RepairServiceList({
  services,
}: {
  services: RepairServiceShape[];
}) {
  return (
    <div className="repair-service-list">
      {services.map((service) => (
        <article className="repair-service-item" key={service._id}>
          <img src={service.icon} alt="" className="repair-service-item__icon" />
          <div className="repair-service-item__body">
            <h3>{service.name}</h3>
            {service.estimatedTime && (
              <p className="repair-service-item__time">{service.estimatedTime}</p>
            )}
          </div>
          <div className="repair-service-item__price">
            {service.discountPrice != null ? (
              <>
                <span className="price-strike">{formatPrice(service.price)}</span>
                <strong>{formatPrice(service.discountPrice)}</strong>
              </>
            ) : (
              <strong>{formatPrice(service.price)}</strong>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
