# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

# Magtemplates
magtemplates = Magtemplate.create([{name: 'Classic', path: 'classic_tmpl'},
                                   {name: 'Default', path: 'default_tmpl'},
                                   {name: 'Preview', path: 'preview_tmpl'}])


# Grids
grids = Grid.create([{name: 'col_1_2_3_b', path: 'n.a'},
                     {name: 'col_2_1_2_b', path: 'n.a'}])

# Widths
widths = Width.create([{name: 'cols-1-b'},
                       {name: 'cols-2-b'},
                       {name: 'cols-3-b'},
                       {name: 'container'}])

# Containers
containers = Container.create([{grid_id: grids[0].id, width_id: widths[1].id, data_sizes: 'title double', pictures: true,
                                text: true, video: false},
                               {grid_id: grids[0].id, width_id: widths[3].id, data_sizes: 'title single', pictures: true,
                                text: true, video: true},
                               {grid_id: grids[0].id, width_id: widths[3].id, data_sizes: 'single', pictures: true,
                                text: false, video: false},
                               {grid_id: grids[0].id, width_id: widths[1].id, data_sizes: 'double', pictures: true,
                                text: false, video: false},
                               {grid_id: grids[0].id, width_id: widths[2].id, data_sizes: 'title', pictures: false,
                                text: true, video: false},
                               {grid_id: grids[1].id, width_id: widths[3].id, data_sizes: 'single', pictures: true,
                                text: false, video: false},
                               {grid_id: grids[1].id, width_id: widths[1].id, data_sizes: 'title double', pictures: true,
                                text: true, video: true},
                               {grid_id: grids[1].id, width_id: widths[3].id, data_sizes: 'title single', pictures: true,
                                text: true, video: true}])
# Sizes
sizes = Size.create([{magtemplate_id: magtemplates[0].id, width_id: widths.first.id, value: '310'},
                     {magtemplate_id: magtemplates[0].id, width_id: widths[3].id, value: '280'},
                     {magtemplate_id: magtemplates[0].id, width_id: widths[2].id, value: '900'},
                     {magtemplate_id: magtemplates[0].id, width_id: widths[1].id, value: '590'},
                     {magtemplate_id: magtemplates[1].id, width_id: widths.first.id, value: '310'},
                     {magtemplate_id: magtemplates[1].id, width_id: widths[3].id, value: '280'},
                     {magtemplate_id: magtemplates[1].id, width_id: widths[2].id, value: '900'},
                     {magtemplate_id: magtemplates[1].id, width_id: widths[1].id, value: '590'},
                     {magtemplate_id: magtemplates[2].id, width_id: widths.first.id, value: '310'},
                     {magtemplate_id: magtemplates[2].id, width_id: widths[3].id, value: '280'},
                     {magtemplate_id: magtemplates[2].id, width_id: widths[2].id, value: '900'},
                     {magtemplate_id: magtemplates[2].id, width_id: widths[1].id, value: '590'}])