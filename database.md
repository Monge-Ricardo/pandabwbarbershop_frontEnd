@startuml

' =========================
' ENTIDADES
' =========================

class Barbershop <<entity>> {
  +id: uuid <<PK>>
  name: varchar
  slug: varchar
  description: text
  logo_url: text
  address: text
  phone: varchar
  email: varchar
  invite_code: varchar
  is_active: boolean
  created_at: timestamptz
  updated_at: timestamptz
}

class User <<entity>> {
  +id: uuid <<PK>>
  full_name: varchar
  email: varchar
  phone: varchar
  avatar_url: text
  created_at: timestamptz
  updated_at: timestamptz
}

class BarbershopMember <<entity>> {
  +id: uuid <<PK>>
  barbershop_id: uuid <<FK>>
  user_id: uuid <<FK>>
  role: varchar
  status: varchar
  joined_at: timestamptz
}

class Service <<entity>> {
  +id: uuid <<PK>>
  barbershop_id: uuid <<FK>>
  name: varchar
  description: text
  price: numeric
  duration_minutes: int
  is_active: boolean
  created_at: timestamptz
}

class Product <<entity>> {
  +id: uuid <<PK>>
  barbershop_id: uuid <<FK>>
  name: varchar
  description: text
  price: numeric
  stock: int
  image_url: text
  is_active: boolean
  created_at: timestamptz
}

class Appointment <<entity>> {
  +id: uuid <<PK>>
  barbershop_id: uuid <<FK>>
  client_id: uuid <<FK>>
  barber_id: uuid <<FK>>
  appointment_date: date
  start_time: time
  end_time: time
  status: varchar
  notes: text
  created_at: timestamptz
}

class AppointmentService <<entity>> {
  +id: uuid <<PK>>
  appointment_id: uuid <<FK>>
  service_id: uuid <<FK>>
}

class Availability <<entity>> {
  +id: uuid <<PK>>
  barbershop_id: uuid <<FK>>
  barber_id: uuid <<FK>>
  day_of_week: int
  start_time: time
  end_time: time
  is_available: boolean
}

class InvitationCode <<entity>> {
  +id: uuid <<PK>>
  barbershop_id: uuid <<FK>>
  code: varchar
  expires_at: timestamptz
  is_active: boolean
  created_at: timestamptz
}

' =========================
' RELACIONES
' =========================

Barbershop "1" -- "0..*" Service
Barbershop "1" -- "0..*" Product
Barbershop "1" -- "0..*" Appointment
Barbershop "1" -- "0..*" BarbershopMember
Barbershop "1" -- "0..*" Availability
Barbershop "1" -- "0..*" InvitationCode

User "1" -- "0..*" BarbershopMember
User "1" -- "0..*" Appointment : client
User "1" -- "0..*" Appointment : barber

Appointment "1" -- "0..*" AppointmentService
Service "1" -- "0..*" AppointmentService

User "1" -- "0..*" Availability

@enduml