import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'workshop_portal.settings')
django.setup()

from workshop_app.models import WorkshopType

workshops = [
    {
        'name': 'Python',
        'description': 'A hands-on workshop covering Python programming fundamentals, data structures, functions, and practical scripting for students and educators.',
        'duration': 2,
        'terms_and_conditions': '<p>The coordinator agrees to:<ul><li>Provide a suitable lab with minimum 20 computers.</li><li>Ensure stable internet connectivity during the workshop.</li><li>Arrange projector and screen for the instructor.</li><li>Coordinate attendance of minimum 20 participants.</li><li>The workshop date cannot be changed within 7 days of the event.</li></ul></p>'
    },
    {
        'name': 'Scilab',
        'description': 'Workshop on Scilab open-source numerical computation software — an alternative to MATLAB for engineering and science students.',
        'duration': 2,
        'terms_and_conditions': '<p>The coordinator agrees to:<ul><li>Provide a lab with Scilab pre-installed on all systems.</li><li>Minimum 20 participants required.</li><li>Coordinator must attend the full workshop session.</li></ul></p>'
    },
    {
        'name': 'OpenFOAM',
        'description': 'Introduction to OpenFOAM Computational Fluid Dynamics (CFD) simulation toolkit, widely used in engineering research and academia.',
        'duration': 2,
        'terms_and_conditions': '<p>The coordinator agrees to:<ul><li>Ensure Linux-based systems with OpenFOAM installed are available.</li><li>Minimum 15 participants with CFD background preferred.</li><li>Lab must have minimum 8 GB RAM per machine.</li></ul></p>'
    },
    {
        'name': 'eSim',
        'description': 'Workshop on eSim — a free and open source EDA tool for circuit design, simulation, and PCB design developed at IIT Bombay.',
        'duration': 1,
        'terms_and_conditions': '<p>The coordinator agrees to:<ul><li>Provide computers with eSim pre-installed.</li><li>Minimum 20 participants required.</li><li>At least one technical coordinator from the institute must be present.</li></ul></p>'
    },
    {
        'name': 'Spoken Tutorial Software Training',
        'description': 'Self-paced spoken tutorial based training on various FOSS tools including LibreOffice, Python, Java, PHP, and more.',
        'duration': 1,
        'terms_and_conditions': '<p>The coordinator agrees to:<ul><li>Arrange headphones for each participant.</li><li>Minimum 20 participants required.</li><li>Participants must complete pre-assessment assignment.</li></ul></p>'
    },
    {
        'name': 'DWSIM',
        'description': 'Workshop on DWSIM, an open-source chemical process simulator used by chemical engineering students and professionals.',
        'duration': 2,
        'terms_and_conditions': '<p>The coordinator agrees to:<ul><li>Provide systems with DWSIM pre-installed.</li><li>Participants should have basic chemical engineering background.</li><li>Minimum 15 participants required.</li></ul></p>'
    },
]

for w in workshops:
    obj, created = WorkshopType.objects.get_or_create(name=w['name'], defaults=w)
    status = "Created" if created else "Already exists"
    print(f"  {status}: [{obj.id}] {obj.name} ({obj.duration} days)")

print(f"\nTotal workshop types in DB: {WorkshopType.objects.count()}")
