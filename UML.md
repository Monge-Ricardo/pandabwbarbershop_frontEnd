@startuml

' ========================
' ENUMS
' ========================
enum Role {
  OWNER
  BARBER
  CLIENT
}

enum AppointmentStatus {
  PENDING
  ACCEPTED
  CANCELLED
  COMPLETED
}

' ========================
' CORE CLASSES
' ========================

class User {
  - id: UUID
  - name: String
  - email: String
  - password: String
  - role: Role
  + login()
  + register()
}

class Barbershop {
  - id: UUID
  - name: String
  - description: String
  - location: String
  - ownerId: UUID
  + updateInfo()
}

class Service {
  - id: UUID
  - name: String
  - price: Float
  - duration: Int
  - barberId: UUID
  + create()
  + update()
  + delete()
}

class Product {
  - id: UUID
  - name: String
  - price: Float
  - barberId: UUID
  + create()
  + update()
  + delete()
}

class Appointment {
  - id: UUID
  - date: Date
  - time: String
  - status: AppointmentStatus
  - clientId: UUID
  - barberId: UUID
  - serviceId: UUID
  + schedule()
  + updateStatus()
}

' ========================
' RELATIONSHIPS
' ========================

' Owner crea barbería
User "1" --> "1" Barbershop : owns

' Barbería tiene barberos
Barbershop "1" --> "1..*" User : barbers

' Barbero crea servicios
User "1" --> "0..*" Service : creates

' Barbero crea productos
User "1" --> "0..*" Product : manages

' Cliente agenda citas
User "1" --> "0..*" Appointment : books

' Barbero recibe citas
User "1" --> "0..*" Appointment : attends

' Servicio pertenece a barbero
Service "1" --> "1" User : belongsTo

' Cita usa servicio
Appointment "1" --> "1" Service : uses

@enduml