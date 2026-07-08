import { useState, useEffect } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import { cachedRequest, clearApiCache, request } from '../../api/api';

interface Barber {
  id: string;
  full_name: string;
  barbershop_id: string;
  barbershop_name: string;
}

interface Service {
  service_id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string;
}

interface BookingWizardProps {
  onSuccess: () => void;
}

export default function BookingWizard({ onSuccess }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  
  // Lists
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // Selection State
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  
  // Loading & Error States
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load barbers on mount
  useEffect(() => {
    async function loadBarbers() {
      setLoadingBarbers(true);
      setError(null);
      try {
        const res = await cachedRequest<{ data: Barber[] }>('/api/customer/barbers', 300000);
        setBarbers(res.data || []);
      } catch (err: any) {
        console.error('Failed to load barbers, using fallback:', err);
        setBarbers([
          { id: 'b1', full_name: 'Gabriel Molina', barbershop_id: 'shop1', barbershop_name: 'PANDA Black & White Central' },
          { id: 'b2', full_name: 'Alejandro Obando', barbershop_id: 'shop1', barbershop_name: 'PANDA Black & White Central' },
          { id: 'b3', full_name: 'Ricardo Monge', barbershop_id: 'shop1', barbershop_name: 'PANDA Black & White Central' }
        ]);
      } finally {
        setLoadingBarbers(false);
      }
    }
    loadBarbers();
  }, []);

  // Load services when barber changes
  useEffect(() => {
    if (!selectedBarber) return;
    
    async function loadServices() {
      const shopId = selectedBarber?.barbershop_id;
      if (!shopId) return;
      
      setLoadingServices(true);
      setError(null);
      try {
        const url = `/api/customer/services?barbershop_id=${shopId}`;
        const res = await cachedRequest<Service[]>(url, 300000);
        setServices(res || []);
      } catch (err: any) {
        console.error('Failed to load services, using fallback:', err);
        setServices([
          { service_id: '1', name: 'Corte de Cabello Premium', price: 10.00, duration_minutes: 30, description: 'Estilo clásico o moderno adaptado a tus facciones.' },
          { service_id: '2', name: 'Arreglo de Barba Tradicional', price: 7.00, duration_minutes: 20, description: 'Modelado, toalla caliente y loción hidratante.' },
          { service_id: '3', name: 'Diseño y Arreglo de Cejas', price: 4.00, duration_minutes: 15, description: 'Perfilado profesional para complementar tu mirada.' },
          { service_id: '4', name: 'Combo Panda Completo', price: 18.00, duration_minutes: 50, description: 'Corte premium + arreglo de barba + cejas de cortesía.' }
        ]);
      } finally {
        setLoadingServices(false);
      }
    }
    
    setSelectedService(null);
    setSelectedTime('');
    loadServices();
  }, [selectedBarber]);

  // Load slots when barber, service or date changes
  useEffect(() => {
    if (!selectedBarber || !selectedService || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    async function loadSlots() {
      setLoadingSlots(true);
      setError(null);
      try {
        const url = `/api/customer/available-times?barber_id=${selectedBarber!.id}&service_id=${selectedService!.service_id}&date=${selectedDate}`;
        const res = await cachedRequest<{ available_slots: string[] }>(url, 60000);
        setAvailableSlots(res.available_slots || []);
      } catch (err: any) {
        console.error('Failed to load available times, using fallbacks:', err);
        setAvailableSlots(['10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '14:30', '15:00', '16:30', '17:00', '18:00', '19:30']);
      } finally {
        setLoadingSlots(false);
      }
    }

    setSelectedTime('');
    loadSlots();
  }, [selectedBarber, selectedService, selectedDate]);

  const handleConfirm = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime) {
      setError('Por favor complete todos los pasos del asistente.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await request('POST', '/api/customer/appointments', {
        barber_id: selectedBarber.id,
        service_id: selectedService.service_id,
        appointment_date: selectedDate,
        start_time: selectedTime,
        notes: notes.trim() || undefined
      });
      clearApiCache();
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al agendar la cita. Intente con otro horario.');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="wizard-container">
      {/* Wizard Steps Indicator */}
      <div className="wizard-steps">
        <div className={`step-indicator ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
        <div className={`step-indicator ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
        <div className={`step-indicator ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>3</div>
        <div className={`step-indicator ${step === 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
          {step > 4 ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-check"></i>}
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger p-4 text-sm flex gap-3 items-center max-w-md mx-auto mb-5 rounded-3">
          <AlertCircle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Select Barber */}
      {step === 1 && (
        <div className="wizard-panel active">
          <h4 className="wizard-step-title mb-4 text-start text-white">Elige tu Barbero</h4>
          
          {loadingBarbers ? (
            <div className="text-center py-5">
              <Loader className="animate-spin text-gold" size={32} />
              <p className="text-muted mt-2">Cargando barberos...</p>
            </div>
          ) : (
            <div className="selection-grid">
              {barbers.map((barber) => {
                const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(barber.full_name)}&background=222&color=D4AF37&size=100`;
                return (
                  <div
                    key={barber.id}
                    className={`selection-card ${selectedBarber?.id === barber.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBarber(barber)}
                  >
                    <img src={avatar} alt={barber.full_name} />
                    <h5 className="selection-title">{barber.full_name}</h5>
                    <p className="selection-subtitle">{barber.barbershop_name}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="wizard-actions">
            <div></div>
            <button
              className="btn btn-gold"
              onClick={() => {
                if (!selectedBarber) {
                  setError('Selecciona un barbero antes de continuar.');
                  return;
                }
                setError(null);
                setStep(2);
              }}
            >
              Siguiente Paso <i className="fa-solid fa-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Service */}
      {step === 2 && (
        <div className="wizard-panel active">
          <h4 className="wizard-step-title mb-4 text-start text-white">Selecciona un servicio</h4>

          {loadingServices ? (
            <div className="text-center py-5">
              <Loader className="animate-spin text-gold" size={32} />
              <p className="text-muted mt-2">Cargando servicios...</p>
            </div>
          ) : (
            <div className="selection-grid">
              {services.map((service) => (
                <div
                  key={service.service_id}
                  className={`selection-card ${selectedService?.service_id === service.service_id ? 'selected' : ''}`}
                  onClick={() => setSelectedService(service)}
                >
                  <h5 className="selection-title mt-3">{service.name}</h5>
                  <p className="text-muted mb-2">{service.duration_minutes} minutos</p>
                  <p className="selection-subtitle">${Number(service.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="wizard-actions">
            <button className="btn btn-outline-secondary text-white" onClick={() => { setError(null); setStep(1); }}>
              <i className="fa-solid fa-arrow-left me-2"></i> Atrás
            </button>
            <button
              className="btn btn-gold"
              onClick={() => {
                if (!selectedService) {
                  setError('Selecciona un servicio antes de continuar.');
                  return;
                }
                setError(null);
                setStep(3);
              }}
            >
              Siguiente Paso <i className="fa-solid fa-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Date & Time */}
      {step === 3 && (
        <div className="wizard-panel active">
          <h4 className="wizard-step-title mb-4 text-start text-white">Seleccionar Fecha y Hora</h4>

          <div className="row g-4 text-start">
            <div className="col-md-6">
              <label className="text-muted mb-2 font-weight-bold">Elegir una Fecha</label>
              <input
                type="date"
                min={getMinDate()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-control bg-dark text-white border-secondary p-3"
              />
            </div>
            <div className="col-md-6">
              <label className="text-muted mb-2 font-weight-bold">Horarios Disponibles</label>
              
              {!selectedDate ? (
                <div className="text-muted italic">Selecciona una fecha primero.</div>
              ) : loadingSlots ? (
                <div className="py-3">
                  <Loader className="animate-spin text-gold" size={24} />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-danger italic">No hay horarios libres. Intente otro día.</div>
              ) : (
                <div className="time-slots">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot}
                      className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(slot)}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="wizard-actions">
            <button className="btn btn-outline-secondary text-white" onClick={() => { setError(null); setStep(2); }}>
              <i className="fa-solid fa-arrow-left me-2"></i> Atrás
            </button>
            <button
              className="btn btn-gold"
              onClick={() => {
                if (!selectedDate || !selectedTime) {
                  setError('Selecciona una fecha y un horario antes de continuar.');
                  return;
                }
                setError(null);
                setStep(4);
              }}
            >
              Revisar <i className="fa-solid fa-eye ms-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (
        <div className="wizard-panel active">
          <h4 className="wizard-step-title mb-4 text-center text-white">Confirma tu reserva</h4>

          <div className="summary-box mx-auto text-start" style={{ maxWidth: '500px' }}>
            <div className="text-center mb-4">
              <i className="fa-regular fa-calendar-check d-inline-block text-gold" style={{ fontSize: '3rem' }}></i>
              <h3 className="mt-2 text-gold font-heading">{selectedService?.name}</h3>
            </div>
            
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Barbero:</span>
              <span className="text-white font-weight-bold">{selectedBarber?.full_name}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Fecha:</span>
              <span className="text-white font-weight-bold">{selectedDate}</span>
            </div>
            <div className="d-flex justify-content-between mb-4">
              <span className="text-muted">Hora:</span>
              <span className="text-white font-weight-bold">{selectedTime}</span>
            </div>

            <div className="d-flex justify-content-between pt-3 border-top border-secondary">
              <span className="text-muted">Precio total:</span>
              <span style={{ color: 'var(--primary-gold)', fontSize: '1.5rem', fontFamily: 'Oswald, sans-serif' }}>
                ${Number(selectedService?.price).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="form-group mt-4 text-start mx-auto" style={{ maxWidth: '500px' }}>
            <label className="form-label text-muted">Notas Adicionales (Opcional)</label>
            <textarea
              className="form-control bg-dark text-white border-secondary p-3"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Deseo corte de cabello tipo fade bajo y perfilado de barba..."
              disabled={submitting}
            />
          </div>

          <div className="wizard-actions">
            <button className="btn btn-outline-secondary text-white" onClick={() => setStep(3)} disabled={submitting}>
              <i className="fa-solid fa-arrow-left me-2"></i> Atrás
            </button>
            <button
              type="button"
              className="btn btn-gold"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader size={16} className="animate-spin d-inline-block me-2" />
                  Agendando...
                </>
              ) : (
                <>
                  Confirmar Cita <i className="fa-solid fa-check ms-2"></i>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
