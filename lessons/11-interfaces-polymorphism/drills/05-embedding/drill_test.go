package drill

import "testing"

func TestLoggerItself(t *testing.T) {
	var l Loggable = Logger{Prefix: "[log]"}
	if got, want := l.Log("start"), "[log] start"; got != want {
		t.Errorf("Logger.Log = %q, chci %q", got, want)
	}
}

// Service nemá vlastní Log — dostane ho promocí z embedded Loggeru.
func TestServiceInheritsLogViaEmbedding(t *testing.T) {
	svc := Service{Logger: Logger{Prefix: "[svc]"}, Name: "api"}

	if got, want := svc.Log("ready"), "[svc] ready"; got != want {
		t.Errorf("Service.Log = %q, chci %q (promovaná metoda z Loggeru)", got, want)
	}

	// A tím Service splňuje i Loggable, aniž bychom to kdekoli deklarovali.
	var l Loggable = svc
	if got, want := l.Log("via interface"), "[svc] via interface"; got != want {
		t.Errorf("přes interface = %q, chci %q", got, want)
	}

	if svc.Name != "api" {
		t.Errorf("Name = %q, chci \"api\" (Service má mít i vlastní pole)", svc.Name)
	}
}
